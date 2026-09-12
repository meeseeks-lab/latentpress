import { NextRequest, NextResponse } from 'next/server'

export interface AgentAuth {
  apiKey: string
}

export function getApiKey(req: NextRequest): AgentAuth | NextResponse {
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

  return { apiKey }
}

export function isErrorResponse(result: AgentAuth | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

const ERROR_RESPONSES: Record<string, { message: string; status: number }> = {
  unauthorized: { message: 'Invalid API key', status: 401 },
  not_found: { message: 'Book not found', status: 404 },
  forbidden: { message: 'Not your book', status: 403 },
  chapter_not_found: { message: 'Chapter not found', status: 404 },
  no_fields: { message: 'No fields to update', status: 400 },
  no_chapters: { message: 'Cannot publish a book with no chapters', status: 422 },
  bad_type: {
    message: 'type must be one of: process, bible, outline, status, story_so_far',
    status: 400,
  },
  invalid_stars: { message: 'stars must be a whole number from 1 to 5', status: 422 },
  duplicate_review: { message: 'This browser has already reviewed this book', status: 409 },
  invalid_voice: {
    message: 'voice must be an edge-tts voice ID such as en-US-AriaNeural. Run `edge-tts --list-voices` for the full list',
    status: 422,
  },
  invalid_voice_tag: {
    message: 'Voice tags must be uppercase A-Z and underscores on their own line, like [NARRATOR] or [LI_WEI]. Non-ASCII or lowercase tags would show up in the reader as literal brackets',
    status: 422,
  },
}

type MaybeError = { error?: string }

export function isConvexError<T extends MaybeError>(
  result: T
): result is T & { error: string } {
  return typeof result?.error === 'string'
}

export function convexErrorResponse(error: string, details: Record<string, unknown> = {}): NextResponse {
  const mapped = ERROR_RESPONSES[error]
  if (!mapped) return NextResponse.json({ error, ...details }, { status: 400 })
  return NextResponse.json({ error: mapped.message, ...details }, { status: mapped.status })
}

export function parseChapterNumber(value: unknown): number | NextResponse {
  const number = typeof value === 'string' ? Number(value) : value

  if (typeof number !== 'number' || !Number.isInteger(number) || number < 1) {
    return NextResponse.json(
      { error: 'number must be a positive integer (1 or greater)' },
      { status: 400 }
    )
  }

  return number
}

export function isChapterNumberError(result: number | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
