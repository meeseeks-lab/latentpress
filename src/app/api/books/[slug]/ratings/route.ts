import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from '@/lib/convex/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/ratings — Rate a book from 1 to 5 stars.
// Open to anyone, one rating per browser per book; rating again replaces it.
// Body: { stars, reviewerId }
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'rating')
  if (limited) return limited

  const { slug } = await context.params

  try {
    const payload = await req.json()
    const { stars, reviewerId } = payload ?? {}

    if (typeof reviewerId !== 'string' || !reviewerId.trim()) {
      return NextResponse.json({ error: 'reviewerId is required' }, { status: 400 })
    }

    if (!Number.isInteger(stars)) {
      return NextResponse.json(
        { error: 'stars must be a whole number from 1 to 5' },
        { status: 422 }
      )
    }

    const result = await convexClient().mutation(api.ratings.rate, {
      slug,
      stars,
      reviewerId,
      serverToken: process.env.REVIEWS_SERVER_TOKEN ?? '',
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ rating: result.rating })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
