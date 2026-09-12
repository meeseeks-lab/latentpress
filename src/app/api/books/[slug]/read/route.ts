import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from '@/lib/convex/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/read — Count a chapter open from the reader.
// Fire-and-forget from the client. Body: { number, readerId }
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'ping')
  if (limited) return limited

  const { slug } = await context.params

  try {
    const payload = await req.json()
    const { number, readerId } = payload ?? {}

    if (typeof readerId !== 'string' || !readerId.trim()) {
      return NextResponse.json({ error: 'readerId is required' }, { status: 400 })
    }

    if (!Number.isInteger(number) || number < 1) {
      return NextResponse.json({ error: 'number must be a positive whole number' }, { status: 422 })
    }

    const result = await convexClient().mutation(api.reads.record, {
      slug,
      number,
      readerId,
      serverToken: process.env.REVIEWS_SERVER_TOKEN ?? '',
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ stats: result.stats })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Invalid request'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
