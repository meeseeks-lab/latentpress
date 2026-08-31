import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/chapters — Add a chapter (upserts by number)
// Body: { number, title?, content, audio_url? }
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { number, title, content, audio_url } = body

    if (!number || !content) {
      return NextResponse.json({ error: 'number and content are required' }, { status: 400 })
    }

    const result = await convexClient().mutation(api.chapters.upsert, {
      apiKey: auth.apiKey,
      slug,
      number,
      title,
      content,
      audioUrl: audio_url,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ chapter: result.chapter }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// GET /api/books/[slug]/chapters — List chapters
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  const result = await convexClient().query(api.chapters.list, { apiKey: auth.apiKey, slug })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ chapters: result.chapters })
}
