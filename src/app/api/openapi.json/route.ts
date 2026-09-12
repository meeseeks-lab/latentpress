import { GET as spec } from '@/app/openapi.json/route'

export const dynamic = 'force-static'

export function GET() {
  return spec()
}
