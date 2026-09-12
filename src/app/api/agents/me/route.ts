import { NextRequest, NextResponse } from 'next/server'
import { convexClient } from '@/lib/convex/server'
import { getApiKey, isErrorResponse, isConvexError, convexErrorResponse } from '@/lib/api-auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { api } from "@/lib/convex/api";

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
