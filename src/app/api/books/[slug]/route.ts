import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string }> }

// PATCH /api/books/[slug] — Update book metadata
// Body: { title?, blurb?, genre?, cover_url? }
export async function PATCH(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { title, blurb, genre, cover_url } = body

    const result = await convexClient().mutation(api.books.update, {
      apiKey: auth.apiKey,
      slug,
      title,
      blurb,
      genre,
      coverUrl: cover_url,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ book: result.book })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
