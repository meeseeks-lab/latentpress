import { NextResponse } from 'next/server'

export const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'] as const
export const AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp3'] as const

export const IMAGE_MAX_BYTES = 5 * 1024 * 1024
export const AUDIO_MAX_BYTES = 50 * 1024 * 1024

const FETCH_TIMEOUT_MS = 15_000

// Hosts an agent must never be able to make the server reach: loopback, link-local
// (cloud instance metadata), and the RFC1918 / CGNAT / unique-local ranges.
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata',
  'metadata.google.internal',
  'metadata.goog',
])

function isBlockedIpv4(host: string): boolean {
  const parts = host.split('.')
  if (parts.length !== 4) return false

  const octets = parts.map((p) => Number(p))
  if (octets.some((n) => !Number.isInteger(n) || n < 0 || n > 255)) return false

  const [a, b] = octets
  if (a === 0 || a === 10 || a === 127) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true
  if (a === 100 && b >= 64 && b <= 127) return true
  return false
}

function isBlockedIpv6(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, '').toLowerCase()
  if (h === '::' || h === '::1') return true
  if (h.startsWith('fe80') || h.startsWith('fc') || h.startsWith('fd')) return true
  // ::ffff:127.0.0.1 style mapped addresses
  const mapped = h.match(/^::ffff:(.+)$/)
  if (mapped) return isBlockedIpv4(mapped[1])
  return false
}

export function validateExternalUrl(raw: unknown): URL | NextResponse {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  let parsed: URL
  try {
    parsed = new URL(raw)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
    return NextResponse.json({ error: 'URL must use http or https' }, { status: 400 })
  }

  const host = parsed.hostname.toLowerCase()
  if (
    BLOCKED_HOSTNAMES.has(host) ||
    host.endsWith('.localhost') ||
    host.endsWith('.internal') ||
    isBlockedIpv4(host) ||
    isBlockedIpv6(host)
  ) {
    return NextResponse.json(
      { error: 'URL host is not allowed. Use a public https URL.' },
      { status: 400 }
    )
  }

  return parsed
}

export function isUrlError(result: URL | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}

interface FetchedMedia {
  buffer: Buffer
  mimeType: string
}

export async function fetchRemoteMedia(
  url: URL,
  allowedTypes: readonly string[],
  maxBytes: number
): Promise<FetchedMedia | NextResponse> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)

  try {
    const res = await fetch(url, { redirect: 'error', signal: controller.signal })

    if (!res.ok) {
      return NextResponse.json(
        { error: `Could not fetch URL (status ${res.status})` },
        { status: 400 }
      )
    }

    const mimeType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase()
    if (!allowedTypes.includes(mimeType)) {
      return NextResponse.json(
        { error: `Invalid file type: ${mimeType || 'unknown'}. Allowed: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    const declared = Number(res.headers.get('content-length') || '0')
    if (declared > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max: ${maxBytes / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await res.arrayBuffer())
    if (buffer.length > maxBytes) {
      return NextResponse.json(
        { error: `File too large. Max: ${maxBytes / 1024 / 1024}MB` },
        { status: 400 }
      )
    }

    return { buffer, mimeType }
  } catch (e: unknown) {
    const aborted = e instanceof Error && e.name === 'AbortError'
    return NextResponse.json(
      { error: aborted ? 'Timed out fetching URL' : 'Could not fetch URL' },
      { status: 400 }
    )
  } finally {
    clearTimeout(timer)
  }
}

export function isMediaError(result: FetchedMedia | NextResponse): result is NextResponse {
  return result instanceof NextResponse
}
