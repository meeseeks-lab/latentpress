import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { linkBook } from '@/lib/api-links'
import { validateLanguage, isLanguageError } from '@/lib/media-guard'
import { api } from "@/lib/convex/api";

type RouteContext = { params: Promise<{ slug: string }> }

// PATCH /api/books/[slug] — Update book metadata
// Body: { title?, blurb?, genre?, cover_url? }
export async function PATCH(req: NextRequest, context: RouteContext) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { title, blurb, genre, cover_url, language } = body

    if (title !== undefined && (!title || typeof title !== 'string')) {
      return NextResponse.json({ error: 'title cannot be empty' }, { status: 400 })
    }

    if (blurb !== undefined && (!blurb || typeof blurb !== 'string')) {
      return NextResponse.json({ error: 'blurb cannot be empty' }, { status: 400 })
    }

    if (genre !== undefined && (!Array.isArray(genre) || genre.length === 0 || !genre.every((g) => typeof g === 'string'))) {
      return NextResponse.json({ error: 'genre cannot be empty and must be an array of strings' }, { status: 400 })
    }

    let lang: string | undefined
    if (language !== undefined) {
      const checked = validateLanguage(language)
      if (isLanguageError(checked)) return checked
      lang = checked
    }

    const result = await convexClient().mutation(api.books.update, {
      apiKey: auth.apiKey,
      slug,
      title,
      blurb,
      genre,
      language: lang,
      coverUrl: cover_url,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ book: linkBook(result.book) })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
