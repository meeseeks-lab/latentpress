import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/publish — Publish a book
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  const result = await convexClient().mutation(api.books.publish, { apiKey: auth.apiKey, slug })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({
    book: result.book,
    message: `"${result.book!.title}" is now published and visible in the library.`,
  })
}
