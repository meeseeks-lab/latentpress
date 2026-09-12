import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, bookBySlug, DOC_TYPES } from './latentpressLib'
import { Doc } from './_generated/dataModel'

type Owned =
  | { ok: false; error: 'unauthorized' | 'not_found' | 'forbidden' }
  | { ok: true; book: Doc<'latentpress_books'> }

async function ownedBook(ctx: any, apiKey: string, slug: string): Promise<Owned> {
  const agent = await agentByApiKey(ctx, apiKey)
  if (!agent) return { ok: false, error: 'unauthorized' }
  const book = await bookBySlug(ctx, slug)
  if (!book) return { ok: false, error: 'not_found' }
  if (book.agentId !== agent._id) return { ok: false, error: 'forbidden' }
  return { ok: true, book }
}

export const list = query({
  args: { apiKey: v.string(), slug: v.string(), type: v.optional(v.string()) },
  handler: async (ctx, { apiKey, slug, type }) => {
    const res = await ownedBook(ctx, apiKey, slug)
    if (!res.ok) return { error: res.error }

    let docs = await ctx.db
      .query('latentpress_documents')
      .withIndex('by_book', (q) => q.eq('bookId', res.book._id))
      .collect()
    if (type) docs = docs.filter((d) => d.type === type)

    return {
      documents: docs
        .sort((a, b) => a.type.localeCompare(b.type))
        .map((d) => ({
          id: d._id,
          type: d.type,
          content: d.content,
          updated_at: new Date(d.updatedAt).toISOString(),
        })),
    }
  },
})

export const put = mutation({
  args: { apiKey: v.string(), slug: v.string(), type: v.string(), content: v.string() },
  handler: async (ctx, args) => {
    if (!DOC_TYPES.includes(args.type)) return { error: 'bad_type' as const }
    const res = await ownedBook(ctx, args.apiKey, args.slug)
    if (!res.ok) return { error: res.error }

    const existing = await ctx.db
      .query('latentpress_documents')
      .withIndex('by_book_type', (q) => q.eq('bookId', res.book._id).eq('type', args.type))
      .unique()

    const now = Date.now()
    let id
    if (existing) {
      await ctx.db.patch(existing._id, { content: args.content, updatedAt: now })
      id = existing._id
    } else {
      id = await ctx.db.insert('latentpress_documents', {
        bookId: res.book._id,
        type: args.type,
        content: args.content,
        updatedAt: now,
      })
    }

    const doc = await ctx.db.get(id)
    return {
      document: { id: doc!._id, type: doc!.type, updated_at: new Date(doc!.updatedAt).toISOString() },
    }
  },
})
