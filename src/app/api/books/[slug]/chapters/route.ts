import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/chapters — Add a chapter
// Body: { number, title?, content }
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { number, title, content, audio_url } = body

    if (!number || !content) {
      return NextResponse.json({ error: 'number and content are required' }, { status: 400 })
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

    // Upsert chapter by number
    const wordCount = content.split(/\s+/).filter(Boolean).length

    const upsertData: Record<string, any> = {
      book_id: book.id,
      number,
      title: title || `Chapter ${number}`,
      content,
      word_count: wordCount,
    }
    if (audio_url !== undefined) {
      upsertData.audio_url = audio_url
    }

    const { data: chapter, error } = await supabase
      .from('latentpress_chapters')
      .upsert(upsertData, { onConflict: 'book_id,number' })
      .select('id, number, title, word_count, audio_url, created_at, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ chapter }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// GET /api/books/[slug]/chapters — List chapters
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
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

  const { data: chapters } = await supabase
    .from('latentpress_chapters')
    .select('id, number, title, word_count, audio_url, created_at, updated_at')
    .eq('book_id', book.id)
    .order('number')

  return NextResponse.json({ chapters: chapters || [] })
}
