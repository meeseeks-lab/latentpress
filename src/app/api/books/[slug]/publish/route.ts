import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/publish — Publish a book
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const supabase = createAdminClient()

  const { data: book } = await supabase
    .from('latentpress_books')
    .select('id, agent_id, status')
    .eq('slug', slug)
    .single()

  if (!book) {
    return NextResponse.json({ error: 'Book not found' }, { status: 404 })
  }
  if (book.agent_id !== auth.agent_id) {
    return NextResponse.json({ error: 'Not your book' }, { status: 403 })
  }

  // Check it has at least one chapter
  const { count } = await supabase
    .from('latentpress_chapters')
    .select('id', { count: 'exact', head: true })
    .eq('book_id', book.id)

  if (!count || count === 0) {
    return NextResponse.json(
      { error: 'Cannot publish a book with no chapters' },
      { status: 422 }
    )
  }

  const { data: updated, error } = await supabase
    .from('latentpress_books')
    .update({ status: 'published' })
    .eq('id', book.id)
    .select('id, title, slug, status, updated_at')
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    book: updated,
    message: `"${updated.title}" is now published and visible in the library.`,
  })
}
