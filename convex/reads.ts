import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import type { QueryCtx } from './_generated/server'
import type { Doc, Id } from './_generated/dataModel'
import { bookBySlug } from './latentpressLib'

const EMPTY = { opens: 0, readers: 0, finished: 0 }

function shape(stats: Doc<'latentpress_book_stats'> | null) {
  if (!stats) return EMPTY
  return { opens: stats.opens, readers: stats.readers, finished: stats.finished }
}

async function statsFor(ctx: QueryCtx, bookId: Id<'latentpress_books'>) {
  return ctx.db
    .query('latentpress_book_stats')
    .withIndex('by_book', (q) => q.eq('bookId', bookId))
    .unique()
}

export const forBook = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null
    return shape(await statsFor(ctx, book._id))
  },
})

// One row per published book that has been opened at least once, keyed by slug.
// The library merges this into its shelf list for the "most read" sort.
export const forBooks = query({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query('latentpress_book_stats').collect()
    const out: { slug: string; opens: number; readers: number; finished: number }[] = []
    for (const row of rows) {
      const book = await ctx.db.get(row.bookId)
      if (!book || book.status !== 'published') continue
      out.push({ slug: book.slug, ...shape(row) })
    }
    return out
  },
})

// Counts a chapter open. A reader is one browser id; opening the same chapter
// again counts as another open but not another reader, and a book is finished
// once its last chapter has been opened. The client dedupes per session so a
// re-render does not count twice.
export const record = mutation({
  args: {
    slug: v.string(),
    number: v.number(),
    readerId: v.string(),
    serverToken: v.string(),
  },
  handler: async (ctx, args) => {
    const expected = process.env.REVIEWS_SERVER_TOKEN
    if (!expected || args.serverToken !== expected) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, args.slug)
    if (!book || book.status !== 'published') return { error: 'not_found' as const }

    const readerId = args.readerId.trim().slice(0, 64)
    if (!readerId) return { error: 'invalid_reviewer' as const }

    const chapters = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    const numbers = chapters.map((c) => c.number)
    if (!numbers.includes(args.number)) return { error: 'chapter_not_found' as const }
    const last = Math.max(...numbers)

    const now = Date.now()
    const read = await ctx.db
      .query('latentpress_reads')
      .withIndex('by_book_reader', (q) => q.eq('bookId', book._id).eq('readerId', readerId))
      .unique()

    const newReader = read === null
    const wasFinished = read?.finished ?? false
    const seen = new Set(read?.chapters ?? [])
    seen.add(args.number)
    const finished = wasFinished || args.number === last

    if (read) {
      await ctx.db.patch(read._id, { chapters: [...seen].sort((a, b) => a - b), finished, lastAt: now })
    } else {
      await ctx.db.insert('latentpress_reads', {
        bookId: book._id,
        readerId,
        chapters: [args.number],
        finished,
        firstAt: now,
        lastAt: now,
      })
    }

    const stats = await statsFor(ctx, book._id)
    const next = {
      opens: (stats?.opens ?? 0) + 1,
      readers: (stats?.readers ?? 0) + (newReader ? 1 : 0),
      finished: (stats?.finished ?? 0) + (finished && !wasFinished ? 1 : 0),
      updatedAt: now,
    }
    if (stats) await ctx.db.patch(stats._id, next)
    else await ctx.db.insert('latentpress_book_stats', { bookId: book._id, ...next })

    return { stats: { opens: next.opens, readers: next.readers, finished: next.finished } }
  },
})
