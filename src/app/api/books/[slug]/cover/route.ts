import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateExternalUrl, isUrlError } from '@/lib/media-guard'
import { api } from "@/lib/convex/api";

type RouteContext = { params: Promise<{ slug: string }> }

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// POST /api/books/[slug]/cover — Upload a book cover
// Body: multipart/form-data with "file" field
// OR: JSON { url: "https://..." } to set from external URL
// OR: JSON { base64: "data:image/png;base64,..." } to upload base64
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const convex = convexClient()
  const contentType = req.headers.get('content-type') || ''

  let fileBuffer: Buffer
  let mimeType: string

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json({ error: 'Missing "file" field in form data' }, { status: 400 })
    }

    mimeType = file.type
    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${mimeType}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    const arrayBuffer = await file.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    fileBuffer = Buffer.from(arrayBuffer)
  } else {
    const body = await req.json()

    if (body.url) {
      const parsed = validateExternalUrl(body.url)
      if (isUrlError(parsed)) return parsed

      const result = await convex.mutation(api.storage.setCover, {
        apiKey: auth.apiKey,
        slug,
        url: body.url,
      })
      if (isConvexError(result)) return convexErrorResponse(result.error)

      return NextResponse.json({ book: result.book, message: 'Cover URL set' })
    }

    if (!body.base64) {
      return NextResponse.json(
        { error: 'Provide one of: multipart file upload, { "url": "..." }, or { "base64": "..." }' },
        { status: 400 }
      )
    }

    let b64Data = body.base64 as string
    mimeType = 'image/png'

    if (b64Data.startsWith('data:')) {
      const match = b64Data.match(/^data:(image\/\w+);base64,(.+)$/)
      if (!match) {
        return NextResponse.json({ error: 'Invalid base64 data URI' }, { status: 400 })
      }
      mimeType = match[1]
      b64Data = match[2]
    }

    if (!ALLOWED_TYPES.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid image type: ${mimeType}. Allowed: ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    fileBuffer = Buffer.from(b64Data, 'base64')
    if (fileBuffer.length > MAX_SIZE) {
      return NextResponse.json(
        { error: `File too large. Max: ${MAX_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      )
    }
  }

  const upload = await convex.mutation(api.storage.generateUploadUrl, { apiKey: auth.apiKey })
  if (isConvexError(upload)) return convexErrorResponse(upload.error)

  const uploaded = await fetch(upload.uploadUrl!, {
    method: 'POST',
    headers: { 'Content-Type': mimeType },
    body: new Uint8Array(fileBuffer),
  })

  if (!uploaded.ok) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { storageId } = await uploaded.json()

  const result = await convex.mutation(api.storage.setCover, {
    apiKey: auth.apiKey,
    slug,
    storageId,
  })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({
    book: result.book,
    message: 'Cover uploaded successfully',
    storage: { storageId, publicUrl: result.book!.cover_url },
  })
}

// DELETE /api/books/[slug]/cover — Remove book cover
export async function DELETE(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  const result = await convexClient().mutation(api.storage.removeCover, {
    apiKey: auth.apiKey,
    slug,
  })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ message: 'Cover removed' })
}
