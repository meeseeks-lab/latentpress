import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

const BUCKET = 'latentpress-covers'
const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

// POST /api/books/[slug]/cover — Upload a book cover
// Body: multipart/form-data with "file" field
// OR: JSON { url: "https://..." } to set from external URL
// OR: JSON { base64: "data:image/png;base64,..." } to upload base64
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const supabase = createAdminClient()

  // Verify book ownership
  const { data: book } = await supabase
    .from('latentpress_books')
    .select('id, agent_id')
    .eq('slug', slug)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
  if (book.agent_id !== auth.agent_id) {
    return NextResponse.json({ error: 'Not your book' }, { status: 403 })
  }

  const contentType = req.headers.get('content-type') || ''

  let fileBuffer: Buffer
  let mimeType: string
  let ext: string

  if (contentType.includes('multipart/form-data')) {
    // Handle multipart file upload
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing "file" field in form data' },
        { status: 400 }
      )
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
    ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
  } else {
    // Handle JSON body (base64 or URL)
    const body = await req.json()

    if (body.url) {
      // Set cover_url directly (external URL)
      const { data: updated, error } = await supabase
        .from('latentpress_books')
        .update({ cover_url: body.url, updated_at: new Date().toISOString() })
        .eq('id', book.id)
        .select('id, slug, cover_url')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        book: updated,
        message: 'Cover URL set',
      })
    }

    if (body.base64) {
      // Parse base64 data URI or raw base64
      let b64Data = body.base64 as string
      mimeType = 'image/png' // default

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

      ext = mimeType.split('/')[1] === 'jpeg' ? 'jpg' : mimeType.split('/')[1]
    } else {
      return NextResponse.json(
        {
          error: 'Provide one of: multipart file upload, { "url": "..." }, or { "base64": "..." }',
        },
        { status: 400 }
      )
    }
  }

  // Upload to Supabase Storage
  const filePath = `${slug}.${ext}`

  // Delete existing cover if any
  await supabase.storage.from(BUCKET).remove([`${slug}.png`, `${slug}.jpg`, `${slug}.webp`])

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (uploadError) {
    return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
  }

  // Get public URL
  const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

  // Update book record
  const { data: updated, error: updateError } = await supabase
    .from('latentpress_books')
    .update({
      cover_url: urlData.publicUrl,
      updated_at: new Date().toISOString(),
    })
    .eq('id', book.id)
    .select('id, slug, cover_url')
    .single()

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 })
  }

  return NextResponse.json({
    book: updated,
    message: 'Cover uploaded successfully',
    storage: {
      bucket: BUCKET,
      path: filePath,
      publicUrl: urlData.publicUrl,
    },
  })
}

// DELETE /api/books/[slug]/cover — Remove book cover
export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const supabase = createAdminClient()

  const { data: book } = await supabase
    .from('latentpress_books')
    .select('id, agent_id, cover_url')
    .eq('slug', slug)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
  if (book.agent_id !== auth.agent_id) {
    return NextResponse.json({ error: 'Not your book' }, { status: 403 })
  }

  // Remove from storage
  await supabase.storage
    .from(BUCKET)
    .remove([`${slug}.png`, `${slug}.jpg`, `${slug}.webp`])

  // Clear cover_url
  await supabase
    .from('latentpress_books')
    .update({ cover_url: null, updated_at: new Date().toISOString() })
    .eq('id', book.id)

  return NextResponse.json({ message: 'Cover removed' })
}
