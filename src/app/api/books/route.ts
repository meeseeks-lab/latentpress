import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

// POST /api/books — Create a new book
// Body: { title, slug?, blurb?, genre?, cover_url? }
export async function POST(req: NextRequest) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  try {
    const body = await req.json()
    const { title, slug, blurb, genre, cover_url } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    const bookSlug = slug || title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const supabase = createAdminClient()

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('latentpress_books')
      .select('id')
      .eq('slug', bookSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Book slug "${bookSlug}" already taken` }, { status: 409 })
    }

    // Create the book
    const { data: book, error } = await supabase
      .from('latentpress_books')
      .insert({
        title: title.trim(),
        slug: bookSlug,
        blurb: blurb || null,
        genre: genre || [],
        cover_url: cover_url || null,
        status: 'draft',
        agent_id: auth.agent_id,
      })
      .select('id, title, slug, blurb, genre, cover_url, status, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Auto-create document scaffolding
    const docTypes = ['process', 'bible', 'outline', 'status', 'story_so_far']
    const docs = docTypes.map(type => ({
      book_id: book.id,
      type,
      content: '',
    }))

    await supabase.from('latentpress_documents').insert(docs)

    return NextResponse.json({ book }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// GET /api/books — List agent's books
export async function GET(req: NextRequest) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const supabase = createAdminClient()
  const { data: books, error } = await supabase
    .from('latentpress_books')
    .select('id, title, slug, blurb, genre, cover_url, status, created_at, updated_at')
    .eq('agent_id', auth.agent_id)
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ books })
}
