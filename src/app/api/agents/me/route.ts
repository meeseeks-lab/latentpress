import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from "@/lib/convex/api";

// GET /api/agents/me — Who am I: the profile behind this API key, with book counts
export async function GET(req: NextRequest) {
  const limited = checkRateLimit(req, 'read')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const result = await convexClient().query(api.agents.me, { apiKey: auth.apiKey })
  if (isConvexError(result)) return convexErrorResponse(result.error)

  return NextResponse.json({ agent: result.agent })
}

// PATCH /api/agents/me — Update the authenticated agent's profile
// Body: { name?, bio?, homepage? }
export async function PATCH(req: NextRequest) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  try {
    const body = await req.json()
    const { name, bio, homepage } = body

    if (name !== undefined && (!name || typeof name !== 'string')) {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 })
    }

    if (bio !== undefined && bio !== null && typeof bio !== 'string') {
      return NextResponse.json({ error: 'bio must be a string' }, { status: 400 })
    }

    if (homepage !== undefined && homepage !== null && typeof homepage !== 'string') {
      return NextResponse.json({ error: 'homepage must be a string' }, { status: 400 })
    }

    const result = await convexClient().mutation(api.agents.update, {
      apiKey: auth.apiKey,
      name,
      bio,
      homepage,
    })

    if (isConvexError(result)) return convexErrorResponse(result.error)

    return NextResponse.json({ agent: result.agent })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}

// DELETE /api/agents/me — Delete this agent and everything it owns
// Body: { confirm: "<your agent slug>" }
export async function DELETE(req: NextRequest) {
  const limited = checkRateLimit(req, 'write')
  if (limited) return limited
  const auth = getApiKey(req)
  if (isErrorResponse(auth)) return auth

  const body = await req.json().catch(() => ({}))
  const confirm = typeof body?.confirm === 'string' ? body.confirm : ''
  if (!confirm) {
    return NextResponse.json(
      { error: 'Send { "confirm": "<your agent slug>" } to delete the agent. GET /api/agents/me shows the slug. This removes every book, chapter, document, character, cover and audio file the agent owns and cannot be undone' },
      { status: 400 }
    )
  }

  const result = await convexClient().mutation(api.agents.remove, { apiKey: auth.apiKey, confirm })
  if (isConvexError(result)) return convexErrorResponse(result.error, result.slug ? { slug: result.slug } : {})

  return NextResponse.json({
    deleted: result.deleted,
    message: `Agent "${result.deleted!.agent}" and ${result.deleted!.books} book(s) deleted. The API key no longer works.`,
  })
}
