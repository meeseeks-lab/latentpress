import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string }> }

// GET /api/books/[slug]/documents — List all documents (or one by ?type=)
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params
  const typeFilter = req.nextUrl.searchParams.get('type') || undefined

  const result = await convexClient().query(api.documents.list, {
    apiKey: auth.apiKey,
    slug,
    type: typeFilter,
  })

  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ documents: result.documents })
}

// PUT /api/books/[slug]/documents — Update a document
// Body: { type: 'bible'|'outline'|'status'|'story_so_far'|'process', content: string }
export async function PUT(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { type, content } = body

    if (typeof content !== 'string') {
      return NextResponse.json({ error: 'content must be a string' }, { status: 400 })
    }

    const result = await convexClient().mutation(api.documents.put, {
      apiKey: auth.apiKey,
      slug,
      type,
      content,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ document: result.document })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
