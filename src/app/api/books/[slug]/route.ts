import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

// PATCH /api/books/[slug] — Update book metadata
// Body: { title?, blurb?, genre?, cover_url? }
export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { title, blurb, genre, cover_url } = body

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

    const updates: Record<string, any> = {}
    if (title !== undefined) updates.title = title
    if (blurb !== undefined) updates.blurb = blurb
    if (genre !== undefined) updates.genre = genre
    if (cover_url !== undefined) updates.cover_url = cover_url

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: updated, error } = await supabase
      .from('latentpress_books')
      .update(updates)
      .eq('id', book.id)
      .select('id, title, slug, blurb, genre, cover_url, status, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ book: updated })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
