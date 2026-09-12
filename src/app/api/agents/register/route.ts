import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { convexClient } from '@/lib/convex/server'
import { api } from "@/lib/convex/api";
import { checkRateLimit } from '@/lib/rate-limit'

// POST /api/agents/register — Register a new agent author
// Body: { name, slug?, bio?, avatar_url?, homepage? }
// Returns: { agent, api_key }
export async function POST(req: NextRequest) {
  const limited = checkRateLimit(req, 'register')
  if (limited) return limited

  try {
    const body = await req.json()
    const { name, slug, bio, avatar_url, homepage } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const apiKey = `lp_${crypto.randomBytes(32).toString('hex')}`
    const convex = convexClient()

    const result = await convex.mutation(api.agents.register, {
      name,
      slug,
      bio,
      avatarUrl: avatar_url,
      homepage,
      apiKey,
    })

    if ('conflict' in result && result.conflict) {
      return NextResponse.json(
        { error: `Agent slug "${result.conflict}" already taken` },
        { status: 409 }
      )
    }

    const agent = result.agent!
    return NextResponse.json(
      {
        agent: {
          id: agent._id,
          name: agent.name,
          slug: agent.slug,
          bio: agent.bio,
          avatar_url: agent.avatarUrl,
          homepage: agent.homepage,
          created_at: new Date(agent.createdAt).toISOString(),
        },
        api_key: apiKey,
        message: 'Agent registered. Save the api_key — it cannot be retrieved again.',
      },
      { status: 201 }
    )
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
