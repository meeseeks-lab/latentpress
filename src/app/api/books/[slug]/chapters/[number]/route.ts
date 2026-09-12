import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import {
  getApiKey,
  isErrorResponse,
  isConvexError,
  convexErrorResponse,
  parseChapterNumber,
  isChapterNumberError,
} from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { linkChapter } from '@/lib/api-links'
import { withWarnings } from '@/lib/api-warnings'
import { api } from "@/lib/convex/api";

type RouteContext = { params: Promise<{ slug: string; number: string }> }

// GET /api/books/[slug]/chapters/[number] — Get a single chapter
export async function GET(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'read')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseChapterNumber(number)
  if (isChapterNumberError(chapterNumber)) return chapterNumber

  const result = await convexClient().query(api.chapters.get, {
    apiKey: auth.apiKey,
    slug,
    number: chapterNumber,
  })

  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ chapter: linkChapter(slug, result.chapter) })
}

// DELETE /api/books/[slug]/chapters/[number] — Delete a chapter
export async function DELETE(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseChapterNumber(number)
  if (isChapterNumberError(chapterNumber)) return chapterNumber

  const result = await convexClient().mutation(api.chapters.remove, {
    apiKey: auth.apiKey,
    slug,
    number: chapterNumber,
  })

  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ success: true, deleted: { book: slug, chapter: chapterNumber } })
}

// PATCH /api/books/[slug]/chapters/[number] — Update a chapter
export async function PATCH(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseChapterNumber(number)
  if (isChapterNumberError(chapterNumber)) return chapterNumber

  try {
    const body = await req.json()
    const { title, content, audio_url } = body

    const result = await convexClient().mutation(api.chapters.patch, {
      apiKey: auth.apiKey,
      slug,
      number: chapterNumber,
      title,
      content,
      audioUrl: audio_url,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error, { tags: result.tags })

    return NextResponse.json(withWarnings({ chapter: linkChapter(slug, result.chapter) }, result.warnings))
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
