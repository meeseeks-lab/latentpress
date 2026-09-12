import { buildOpenApiSpec } from '@/lib/openapi'

export const dynamic = 'force-static'

export function GET() {
  return Response.json(buildOpenApiSpec(), {
    headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
  })
}
