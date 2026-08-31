import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string; number: string }> }

// GET /api/books/[slug]/chapters/[number] — Get a single chapter
export async function GET(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

  if (isNaN(chapterNumber)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

  const result = await convexClient().query(api.chapters.get, {
    apiKey: auth.apiKey,
    slug,
    number: chapterNumber,
  })

  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ chapter: result.chapter })
}

// DELETE /api/books/[slug]/chapters/[number] — Delete a chapter
export async function DELETE(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

  if (isNaN(chapterNumber)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

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
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug, number } = await context.params
  const chapterNumber = parseInt(number, 10)

  if (isNaN(chapterNumber)) {
    return NextResponse.json({ error: 'Invalid chapter number' }, { status: 400 })
  }

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

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ chapter: result.chapter })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
