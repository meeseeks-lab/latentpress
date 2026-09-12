import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import {
  getApiKey,
  isErrorResponse,
  isConvexError,
  convexErrorResponse,
  parseChapterNumber,
  isChapterNumberError,
} from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from "@/lib/convex/api";

type RouteContext = { params: Promise<{ slug: string; number: string }> }

const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']

// POST /api/books/[slug]/chapters/[number]/audio — Upload chapter audio
// Body: multipart/form-data with "file" field
// OR: JSON { url: "https://..." } to set from external URL
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number: numStr } = await context.params
  const chapterNumber = parseChapterNumber(numStr)
  if (isChapterNumberError(chapterNumber)) return chapterNumber

  const convex = convexClient()
  const contentType = req.headers.get('content-type') || ''

  if (!contentType.includes('multipart/form-data')) {
    const body = await req.json()

    if (!body.url) {
      return NextResponse.json(
        { error: 'Provide multipart file upload or { "url": "..." }' },
        { status: 400 }
      )
    }

    try {
      const parsed = new URL(body.url)
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
      }
    } catch {
      return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
    }

    const result = await convex.mutation(api.storage.setAudio, {
      apiKey: auth.apiKey,
      slug,
      number: chapterNumber,
      url: body.url,
    })
    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ chapter: result.chapter, message: 'Audio URL set' })
  }

  const formData = await req.formData()
  const file = formData.get('file')

  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: 'Missing "file" field in form data' }, { status: 400 })
  }

  const mimeType = file.type
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

  const upload = await convex.mutation(api.storage.generateUploadUrl, { apiKey: auth.apiKey })
  if (isConvexError(upload)) return convexErrorResponse(upload.error)

  const uploaded = await fetch(upload.uploadUrl!, {
    method: 'POST',
    headers: { 'Content-Type': mimeType },
    body: new Uint8Array(Buffer.from(arrayBuffer)),
  })

  if (!uploaded.ok) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }

  const { storageId } = await uploaded.json()

  const result = await convex.mutation(api.storage.setAudio, {
    apiKey: auth.apiKey,
    slug,
    number: chapterNumber,
    storageId,
  })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({
    chapter: result.chapter,
    message: 'Audio uploaded successfully',
    storage: { storageId, publicUrl: result.chapter!.audio_url },
  })
}

// DELETE /api/books/[slug]/chapters/[number]/audio — Remove chapter audio
export async function DELETE(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number: numStr } = await context.params
  const chapterNumber = parseChapterNumber(numStr)
  if (isChapterNumberError(chapterNumber)) return chapterNumber

  const result = await convexClient().mutation(api.storage.removeAudio, {
    apiKey: auth.apiKey,
    slug,
    number: chapterNumber,
  })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ message: 'Audio removed' })
}
