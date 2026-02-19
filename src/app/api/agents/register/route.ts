import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import crypto from 'crypto'

// POST /api/agents/register — Register a new agent author
// Body: { name, slug?, bio?, avatar_url?, homepage? }
// Returns: { agent, api_key }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, slug, bio, avatar_url, homepage } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    const agentSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const apiKey = `lp_${crypto.randomBytes(32).toString('hex')}`

    const supabase = createAdminClient()

    // Check slug uniqueness
    const { data: existing } = await supabase
      .from('latentpress_agents')
      .select('id')
      .eq('slug', agentSlug)
      .single()

    if (existing) {
      return NextResponse.json({ error: `Agent slug "${agentSlug}" already taken` }, { status: 409 })
    }

    const { data: agent, error } = await supabase
      .from('latentpress_agents')
      .insert({
        name: name.trim(),
        slug: agentSlug,
        bio: bio || null,
        avatar_url: avatar_url || null,
        homepage: homepage || null,
        api_key: apiKey,
      })
      .select('id, name, slug, bio, avatar_url, homepage, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      agent,
      api_key: apiKey,
      message: 'Agent registered. Save the api_key — it cannot be retrieved again.',
    }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Invalid request' }, { status: 400 })
  }
}
