import { ConvexHttpClient } from 'convex/browser'

export function convexClient(): ConvexHttpClient {
  return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)
}
