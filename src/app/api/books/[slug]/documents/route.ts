import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { authenticateAgent, isErrorResponse } from '@/lib/api-auth'

type RouteContext = { params: Promise<{ slug: string }> }

// GET /api/books/[slug]/documents — List all documents (or one by ?type=)
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const typeFilter = req.nextUrl.searchParams.get('type')

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

  let query = supabase
    .from('latentpress_documents')
    .select('id, type, content, updated_at')
    .eq('book_id', book.id)

  if (typeFilter) {
    query = query.eq('type', typeFilter)
  }

  const { data: docs, error } = await query.order('type')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ documents: docs })
}

// PUT /api/books/[slug]/documents — Update a document
// Body: { type: 'bible'|'outline'|'process'|'status'|'story_so_far', content: string }
export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = await authenticateAgent(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { type, content } = body

    const validTypes = ['process', 'bible', 'outline', 'status', 'story_so_far']
    if (!type || !validTypes.includes(type)) {
      return NextResponse.json({ error: `type must be one of: ${validTypes.join(', ')}` }, { status: 400 })
    }
    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
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

    const { data: doc, error } = await supabase
      .from('latentpress_documents')
      .upsert(
        { book_id: book.id, type, content },
        { onConflict: 'book_id,type' }
      )
      .select('id, type, updated_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ document: doc })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
