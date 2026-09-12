import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { bookBySlug } from './latentpressLib'
import { Doc } from './_generated/dataModel'

const LIST_LIMIT = 50
const MAX_BODY = 2000
const MAX_NAME = 40
const UNATTRIBUTED = 'Unattributed'

function shape(review: Doc<'latentpress_reviews'>) {
  return {
    id: review._id,
    stars: review.stars,
    body: review.body,
    name: review.name,
    created_at: new Date(review.createdAt).toISOString(),
  }
}

function normalizeBody(body: string | undefined) {
  const trimmed = body?.trim()
  return trimmed ? trimmed.slice(0, MAX_BODY) : null
}

function normalizeName(name: string | undefined) {
  const trimmed = name?.trim()
  return trimmed ? trimmed.slice(0, MAX_NAME) : UNATTRIBUTED
}

export const byBook = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null

    const all = await ctx.db
      .query('latentpress_reviews')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .order('desc')
      .collect()

    const visible = all.filter((review) => review.hiddenAt === undefined)
    const count = visible.length

    // The average covers every visible report. LIST_LIMIT caps only what is
    // rendered, so do not compute the average from the sliced list.
    const average =
      count > 0
        ? Math.round((visible.reduce((sum, review) => sum + review.stars, 0) / count) * 10) / 10
        : null

    return { reviews: visible.slice(0, LIST_LIMIT).map(shape), count, average }
  },
})

export const create = mutation({
  args: {
    slug: v.string(),
    stars: v.number(),
    body: v.optional(v.string()),
    name: v.optional(v.string()),
    reviewerId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    // This mutation is reachable at the deployment URL without the Next route,
    // so the route-level rate limit and honeypot only count once this holds.
    const expected = process.env.REVIEWS_SERVER_TOKEN
    if (!expected || args.serverToken !== expected) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, args.slug)
    if (!book || book.status !== 'published') return { error: 'not_found' as const }

    if (!Number.isInteger(args.stars) || args.stars < 1 || args.stars > 5) {
      return { error: 'invalid_stars' as const }
    }

    const reviewerId = args.reviewerId.trim().slice(0, 64)
    const existing = await ctx.db
      .query('latentpress_reviews')
      .withIndex('by_book_reviewer', (q) => q.eq('bookId', book._id).eq('reviewerId', reviewerId))
      .first()
    if (existing) return { error: 'duplicate_review' as const }

    const reviewId = await ctx.db.insert('latentpress_reviews', {
      bookId: book._id,
      stars: args.stars,
      body: normalizeBody(args.body),
      name: normalizeName(args.name),
      reviewerId,
      createdAt: Date.now(),
    })

    // Touches nothing on the book. updatedAt drives arrivals ordering, the
    // "just landed" wash, the library's written dates and the sitemap, so a
    // review must not move any of them.
    const review = await ctx.db.get(reviewId)
    return { review: shape(review!) }
  },
})
