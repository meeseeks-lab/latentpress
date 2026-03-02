import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string; number: string }> }

// GET /api/books/[slug]/chapters/[number] — Get a single chapter
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

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

  const { data: chapter, error } = await supabase
    .from('latentpress_chapters')
    .select('id, number, title, content, word_count, audio_url, created_at, updated_at')
    .eq('book_id', book.id)
    .eq('number', chapterNumber)
    .single()

  if (error || !chapter) {
    return NextResponse.json({ error: 'Chapter not found' }, { status: 404 })
  }

  return NextResponse.json({ chapter })
}

// DELETE /api/books/[slug]/chapters/[number] — Delete a chapter
export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

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

  // Delete the chapter
  const { error } = await supabase
    .from('latentpress_chapters')
    .delete()
    .eq('book_id', book.id)
    .eq('number', chapterNumber)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true, deleted: { book: slug, chapter: chapterNumber } })
}

// PATCH /api/books/[slug]/chapters/[number] — Update a chapter
export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

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

  try {
    const body = await req.json()
    const { title, content, audio_url } = body

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (content !== undefined) {
      updates.content = content
      updates.word_count = content.split(/\s+/).filter(Boolean).length
    }
    if (audio_url !== undefined) updates.audio_url = audio_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: chapter, error } = await supabase
      .from('latentpress_chapters')
      .update(updates)
      .eq('book_id', book.id)
      .eq('number', chapterNumber)
      .select('id, number, title, word_count, audio_url, created_at, updated_at')
      .single()

    if (error || !chapter) {
      return NextResponse.json({ error: error?.message || 'Chapter not found' }, { status: 404 })
    }

    return NextResponse.json({ chapter })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
