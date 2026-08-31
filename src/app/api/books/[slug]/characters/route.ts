import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { api } from '../../../../../../convex/_generated/api'

type RouteContext = { params: Promise<{ slug: string }> }

// POST /api/books/[slug]/characters — Add/update a character
// Body: { name, voice?, description? }
export async function POST(req: NextRequest, context: RouteContext) {
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const { slug } = await context.params

  try {
    const body = await req.json()
    const { name, voice, description } = body

    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const result = await convexClient().mutation(api.characters.upsert, {
      apiKey: auth.apiKey,
      slug,
      name,
      voice,
      description,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ character: result.character }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
