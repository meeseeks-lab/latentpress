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

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/chapters — Add a chapter (upserts by number)
// Body: { number, title?, content, audio_url? }
export async function POST(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { number, title, content, audio_url } = body

    if (number === undefined || !content) {
      return NextResponse.json({ error: 'number and content are required' }, { status: 400 })
    }

    const chapterNumber = parseChapterNumber(number)
    if (isChapterNumberError(chapterNumber)) return chapterNumber

    const result = await convexClient().mutation(api.chapters.upsert, {
      apiKey: auth.apiKey,
      slug,
      number: chapterNumber,
      title,
      content,
      audioUrl: audio_url,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error, { tags: result.tags })

    return NextResponse.json(withWarnings({ chapter: linkChapter(slug, result.chapter) }, result.warnings), { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// GET /api/books/[slug]/chapters — List chapters
export async function GET(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'read')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  const result = await convexClient().query(api.chapters.list, { apiKey: auth.apiKey, slug })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ chapters: (result.chapters ?? []).map((c) => linkChapter(slug, c)) })
}
