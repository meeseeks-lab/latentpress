import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, bookBySlug } from './latentpressLib'

export const upsert = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    name: v.string(),
    voice: v.optional(v.string()),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    const book = await bookBySlug(ctx, args.slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const name = args.name.trim()
    const existing = await ctx.db
      .query('latentpress_characters')
      .withIndex('by_book_name', (q) => q.eq('bookId', book._id).eq('name', name))
      .unique()

    let id
    if (existing) {
      await ctx.db.patch(existing._id, {
        voice: args.voice ?? null,
        description: args.description ?? null,
      })
      id = existing._id
    } else {
      id = await ctx.db.insert('latentpress_characters', {
        bookId: book._id,
        name,
        voice: args.voice ?? null,
        description: args.description ?? null,
        createdAt: Date.now(),
      })
    }

    const c = await ctx.db.get(id)
    return {
      character: {
        id: c!._id,
        name: c!.name,
        voice: c!.voice,
        description: c!.description,
        created_at: new Date(c!.createdAt).toISOString(),
      },
    }
  },
})

export const listForBook = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return []
    const chars = await ctx.db
      .query('latentpress_characters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    return chars.map((c) => ({ id: c._id, name: c.name, voice: c.voice, description: c.description }))
  },
})
