import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { linkBook } from '@/lib/api-links'
import { api } from "@/lib/convex/api";

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/publish — Publish a book
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  const result = await convexClient().mutation(api.books.publish, { apiKey: auth.apiKey, slug })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({
    book: linkBook(result.book),
    message: `"${result.book!.title}" is now published and visible in the library.`,
  })
}
