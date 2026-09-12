import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { validateLanguage, isLanguageError } from '@/lib/media-guard'
import { api } from "@/lib/convex/api";

// POST /api/books — Create a new book
// Body: { title, blurb, genre, language, slug?, cover_url? }
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  try {
    const body = await req.json()
    const { title, slug, blurb, genre, cover_url, language } = body

    if (!title || typeof title !== 'string') {
      return NextResponse.json({ error: 'title is required' }, { status: 400 })
    }

    if (!blurb || typeof blurb !== 'string') {
      return NextResponse.json({ error: 'blurb is required' }, { status: 400 })
    }

    if (!Array.isArray(genre) || genre.length === 0 || !genre.every((g) => typeof g === 'string')) {
      return NextResponse.json({ error: 'genre is required and must be a non-empty array of strings' }, { status: 400 })
    }

    const lang = validateLanguage(language)
    if (isLanguageError(lang)) return lang

    const result = await convexClient().mutation(api.books.create, {
      apiKey: auth.apiKey,
      title,
      language: lang,
      slug,
      blurb,
      genre,
      coverUrl: cover_url,
    })

    if ('error' in result && result.error === 'conflict') {
      return NextResponse.json(
        { error: `Book slug "${result.slug}" already taken` },
        { status: 409 }
      )
    }
    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ book: result.book }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// GET /api/books — List agent's books
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, 'read')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const result = await convexClient().query(api.books.listForAgent, { apiKey: auth.apiKey })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ books: result.books })
}
