import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/characters — Add/update a character
// Body: { name, voice?, description? }
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { name, voice, description } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
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

    const { data: character, error } = await supabase
      .from('latentpress_characters')
      .upsert(
        {
          book_id: book.id,
          name: name.trim(),
          voice: voice || null,
          description: description || null,
        },
        { onConflict: 'book_id,name' }
      )
      .select('id, name, voice, description, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ character }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
