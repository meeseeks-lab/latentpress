import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from '@/lib/convex/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/reviews — File a reader report.
// The one route under /api/books that takes no API key, because reviews are open
// to anyone. Lengths and the star range are the mutation's call, not this file's.
// Body: { stars, reviewerId, body?, name?, lp_check? (honeypot) }
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'review')
  if (limited) return limited

  const { slug } = await context.params

  try {
    const payload = await req.json()
    const { stars, body, name, reviewerId, lp_check } = payload ?? {}

    if (typeof lp_check === 'string' && lp_check.trim()) {
      return NextResponse.json({ review: null }, { status: 201 })
    }

    if (typeof reviewerId !== 'string' || !reviewerId.trim()) {
      return NextResponse.json({ error: 'reviewerId is required' }, { status: 400 })
    }

    if (!Number.isInteger(stars)) {
      return NextResponse.json(
        { error: 'stars must be a whole number from 1 to 5' },
        { status: 422 }
      )
    }

    if (body != null && typeof body !== 'string') {
      return NextResponse.json({ error: 'body must be a string' }, { status: 400 })
    }

    if (name != null && typeof name !== 'string') {
      return NextResponse.json({ error: 'name must be a string' }, { status: 400 })
    }

    const result = await convexClient().mutation(api.reviews.create, {
      slug,
      stars,
      body: body ?? undefined,
      name: name ?? undefined,
      reviewerId,
      serverToken: process.env.REVIEWS_SERVER_TOKEN ?? '',
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ review: result.review }, { status: 201 })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
