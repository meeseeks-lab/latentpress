import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string; number: string }> }

const BUCKET = 'latentpress-audio'
const MAX_SIZE = 50 * 1024 * 1024 // 50MB
const ALLOWED_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3']

// POST /api/books/[slug]/chapters/[number]/audio — Upload chapter audio
// Body: multipart/form-data with "file" field
// OR: JSON { url: "https://..." } to set from external URL
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number: numStr } = await context.params
  const chapterNumber = parseInt(numStr)
  if (isNaN(chapterNumber)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

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

  // Verify chapter exists
  const { data: chapter } = await supabase
    .from('latentpress_chapters')
    .select('id')
    .eq('book_id', book.id)
    .eq('number', chapterNumber)
    .single()

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  const contentType = req.headers.get('content-type') || ''

  if (contentType.includes('multipart/form-data')) {
    const formData = await req.formData()
    const file = formData.get('file')

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: 'Missing "file" field in form data' },
        { status: 400 }
      )
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

    const fileBuffer = Buffer.from(arrayBuffer)
    const ext = mimeType === 'audio/mpeg' || mimeType === 'audio/mp3' ? 'mp3'
      : mimeType === 'audio/wav' ? 'wav'
      : 'ogg'
    const filePath = `${slug}/chapter-${chapterNumber}.${ext}`

    // Remove existing audio files for this chapter
    await supabase.storage.from(BUCKET).remove([
      `${slug}/chapter-${chapterNumber}.mp3`,
      `${slug}/chapter-${chapterNumber}.wav`,
      `${slug}/chapter-${chapterNumber}.ogg`,
    ])

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, fileBuffer, {
        contentType: mimeType,
        upsert: true,
      })

    if (uploadError) {
      return NextResponse.json({ error: `Upload failed: ${uploadError.message}` }, { status: 500 })
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(filePath)

    // Update chapter record
    const { data: updated, error: updateError } = await supabase
      .from('latentpress_chapters')
      .update({ audio_url: urlData.publicUrl, updated_at: new Date().toISOString() })
      .eq('id', chapter.id)
      .select('id, number, title, audio_url')
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      chapter: updated,
      message: 'Audio uploaded successfully',
      storage: {
        bucket: BUCKET,
        path: filePath,
        publicUrl: urlData.publicUrl,
      },
    })
  } else {
    // JSON body — external URL
    const body = await req.json()

    if (body.url) {
      let parsed: URL
      try {
        parsed = new URL(body.url)
      } catch {
        return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
      }
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
        return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
      }

      const { data: updated, error } = await supabase
        .from('latentpress_chapters')
        .update({ audio_url: body.url, updated_at: new Date().toISOString() })
        .eq('id', chapter.id)
        .select('id, number, title, audio_url')
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({
        chapter: updated,
        message: 'Audio URL set',
      })
    }

    return NextResponse.json(
      { error: 'Provide multipart file upload or { "url": "..." }' },
      { status: 400 }
    )
  }
}

// DELETE /api/books/[slug]/chapters/[number]/audio — Remove chapter audio
export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number: numStr } = await context.params
  const chapterNumber = parseInt(numStr)
  if (isNaN(chapterNumber)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

  const supabase = createAdminClient()

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

  const { data: chapter } = await supabase
    .from('latentpress_chapters')
    .select('id')
    .eq('book_id', book.id)
    .eq('number', chapterNumber)
    .single()

  if (!chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  // Remove from storage
  await supabase.storage.from(BUCKET).remove([
    `${slug}/chapter-${chapterNumber}.mp3`,
    `${slug}/chapter-${chapterNumber}.wav`,
    `${slug}/chapter-${chapterNumber}.ogg`,
  ])

  // Clear audio_url
  await supabase
    .from('latentpress_chapters')
    .update({ audio_url: null, updated_at: new Date().toISOString() })
    .eq('id', chapter.id)

  return NextResponse.json({ message: 'Audio removed' })
}
