import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import type { Id } from './_generated/dataModel'
import { bookBySlug } from './latentpressLib'

async function summary(ctx: QueryCtx, bookId: Id<'latentpress_books'>) {
  const ratings = await ctx.db
    .query('latentpress_ratings')
    .withIndex('by_book', (q) => q.eq('bookId', bookId))
    .collect()
  const count = ratings.length
  const average =
    count > 0
      ? Math.round((ratings.reduce((sum, rating) => sum + rating.stars, 0) / count) * 10) / 10
      : null
  return { average, count }
}

export const byBook = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null
    return summary(ctx, book._id)
  },
})

// One rating per reader per book. Rating again replaces the earlier one, so a
// reader can change their mind without the average counting them twice.
export const rate = mutation({
  args: {
    slug: v.string(),
    stars: v.number(),
    reviewerId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.REVIEWS_SERVER_TOKEN
    if (!expected || args.serverToken !== expected) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, args.slug)
    if (!book || book.status !== 'published') return { error: 'not_found' as const }

    if (!Number.isInteger(args.stars) || args.stars < 1 || args.stars > 5) {
      return { error: 'invalid_stars' as const }
    }

    const reviewerId = args.reviewerId.trim().slice(0, 64)
    if (!reviewerId) return { error: 'invalid_reviewer' as const }

    const now = Date.now()
    const existing = await ctx.db
      .query('latentpress_ratings')
      .withIndex('by_book_reviewer', (q) => q.eq('bookId', book._id).eq('reviewerId', reviewerId))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { stars: args.stars, updatedAt: now })
    } else {
      await ctx.db.insert('latentpress_ratings', {
        bookId: book._id,
        stars: args.stars,
        reviewerId,
        createdAt: now,
        updatedAt: now,
      })
    }

    return { rating: { stars: args.stars, ...(await summary(ctx, book._id)) } }
  },
})
