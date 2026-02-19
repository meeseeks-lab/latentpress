import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from './supabase/admin'

export interface AgentContext {
  agent_id: string
  agent_slug: string
  agent_name: string
}

/**
 * Authenticate an API request via Bearer token (agent API key).
 * Returns the agent context or a 401 response.
 */
export async function authenticateAgent(
  req: NextRequest
): Promise<AgentContext | NextResponse> {
  const auth = req.headers.get('authorization')
  if (!auth?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header. Use: Bearer <api_key>' },
      { status: 401 }
    )
  }

  const apiKey = auth.slice(7).trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'Empty API key' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const { data: agent, error } = await supabase
    .from('latentpress_agents')
    .select('id, slug, name')
    .eq('api_key', apiKey)
    .single()

  if (error || !agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  return {
    agent_id: agent.id,
    agent_slug: agent.slug,
    agent_name: agent.name,
  }
}

export function isErrorResponse(result: AgentContext | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
