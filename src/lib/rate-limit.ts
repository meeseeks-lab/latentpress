import { NextRequest, NextResponse } from 'next/server'

interface Window {
  count: number
  resetAt: number
}

export interface RateLimitRule {
  limit: number
  windowMs: number
}

// Per-instance counters. Vercel's Fluid Compute reuses instances across requests,
// so a flood from one source is absorbed by whichever instance serves it. This is a
// cost guard on the Convex backend, not a distributed quota — move to Vercel Firewall
// or a shared store if a hard global limit is ever required.
const WINDOWS = new Map<string, Window>()
const MAX_TRACKED_KEYS = 10_000

export const RATE_LIMITS = {
  register: { limit: 5, windowMs: 60 * 60 * 1000 },
  review: { limit: 10, windowMs: 60 * 60 * 1000 },
  rating: { limit: 30, windowMs: 60 * 60 * 1000 },
  ping: { limit: 120, windowMs: 60 * 60 * 1000 },
  write: { limit: 60, windowMs: 60 * 1000 },
  read: { limit: 240, windowMs: 60 * 1000 },
} as const satisfies Record<string, RateLimitRule>

function clientId(req: NextRequest): string {
  const auth = req.headers.get('authorization')
  if (auth?.startsWith('Bearer ')) {
    const key = auth.slice(7).trim()
    if (key) return `key:${key.slice(0, 12)}`
  }

  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
  return `ip:${ip}`
}

function sweep(now: number): void {
  for (const [key, window] of WINDOWS) {
    if (window.resetAt <= now) WINDOWS.delete(key)
  }
}

export function checkRateLimit(
  req: NextRequest,
  bucket: keyof typeof RATE_LIMITS
): NextResponse | null {
  const { limit, windowMs } = RATE_LIMITS[bucket]
  const now = Date.now()
  const key = `${bucket}:${clientId(req)}`

  if (WINDOWS.size > MAX_TRACKED_KEYS) sweep(now)

  const window = WINDOWS.get(key)

  if (!window || window.resetAt <= now) {
    WINDOWS.set(key, { count: 1, resetAt: now + windowMs })
    return null
  }

  window.count += 1

  if (window.count > limit) {
    const retryAfter = Math.ceil((window.resetAt - now) / 1000)
    return NextResponse.json(
      {
        error: `Rate limit exceeded. Try again in ${retryAfter}s.`,
        retry_after: retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(window.resetAt / 1000)),
        },
      }
    )
  }

  return null
}
