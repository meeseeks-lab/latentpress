import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, bookBySlug, slugify, DOC_TYPES } from './lib'
import { Doc } from './_generated/dataModel'

function shape(book: Doc<'books'>) {
  return {
    id: book._id,
    title: book.title,
    slug: book.slug,
    blurb: book.blurb,
    genre: book.genre,
    cover_url: book.coverUrl,
    status: book.status,
    created_at: new Date(book.createdAt).toISOString(),
    updated_at: new Date(book.updatedAt).toISOString(),
  }
}

export const create = mutation({
  args: {
    apiKey: v.string(),
    title: v.string(),
    slug: v.optional(v.string()),
    blurb: v.optional(v.string()),
    genre: v.optional(v.array(v.string())),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const bookSlug = args.slug || slugify(args.title)
    const existing = await bookBySlug(ctx, bookSlug)
    if (existing) return { error: 'conflict' as const, slug: bookSlug }

    const now = Date.now()
    const id = await ctx.db.insert('books', {
      agentId: agent._id,
      title: args.title.trim(),
      slug: bookSlug,
      blurb: args.blurb ?? null,
      genre: args.genre ?? [],
      coverUrl: args.coverUrl ?? null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })

    for (const type of DOC_TYPES) {
      await ctx.db.insert('documents', { bookId: id, type, content: '', updatedAt: now })
    }

    const book = await ctx.db.get(id)
    return { book: shape(book!) }
  },
})

export const listForAgent = query({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const books = await ctx.db
      .query('books')
      .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
      .order('desc')
      .collect()

    const enriched = []
    for (const b of books) {
      const chapters = await ctx.db
        .query('chapters')
        .withIndex('by_book', (q) => q.eq('bookId', b._id))
        .collect()
      const nums = chapters.map((c) => c.number)
      enriched.push({
        ...shape(b),
        chapter_count: chapters.length,
        highest_chapter: nums.length ? Math.max(...nums) : 0,
        next_chapter: (nums.length ? Math.max(...nums) : 0) + 1,
      })
    }
    return { books: enriched }
  },
})

export const update = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    title: v.optional(v.string()),
    blurb: v.optional(v.string()),
    genre: v.optional(v.array(v.string())),
    coverUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, args.slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const patch: Record<string, unknown> = {}
    if (args.title !== undefined) patch.title = args.title
    if (args.blurb !== undefined) patch.blurb = args.blurb
    if (args.genre !== undefined) patch.genre = args.genre
    if (args.coverUrl !== undefined) patch.coverUrl = args.coverUrl
    if (Object.keys(patch).length === 0) return { error: 'no_fields' as const }

    patch.updatedAt = Date.now()
    await ctx.db.patch(book._id, patch)
    const updated = await ctx.db.get(book._id)
    return { book: shape(updated!) }
  },
})

export const publish = mutation({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const chapters = await ctx.db
      .query('chapters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    if (chapters.length === 0) return { error: 'no_chapters' as const }

    await ctx.db.patch(book._id, { status: 'published', updatedAt: Date.now() })
    const updated = await ctx.db.get(book._id)
    return { book: shape(updated!), chapter_count: chapters.length }
  },
})

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const books = await ctx.db
      .query('books')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .order('desc')
      .collect()
    const sorted = books.sort((a, b) => b.createdAt - a.createdAt)
    return (limit ? sorted.slice(0, limit) : sorted).map(shape)
  },
})

export const stats = query({
  args: {},
  handler: async (ctx) => {
    const [books, chapters, agents] = await Promise.all([
      ctx.db.query('books').collect(),
      ctx.db.query('chapters').collect(),
      ctx.db.query('agents').collect(),
    ])
    return { books: books.length, chapters: chapters.length, agents: agents.length }
  },
})

export const detailBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null

    const [chapters, characters] = await Promise.all([
      ctx.db.query('chapters').withIndex('by_book', (q) => q.eq('bookId', book._id)).collect(),
      ctx.db.query('characters').withIndex('by_book', (q) => q.eq('bookId', book._id)).collect(),
    ])

    const agent = book.agentId ? await ctx.db.get(book.agentId) : null

    return {
      book: shape(book),
      chapters: chapters
        .sort((a, b) => a.number - b.number)
        .map((c) => ({
          id: c._id,
          number: c.number,
          title: c.title,
          word_count: c.wordCount,
          audio_url: c.audioUrl,
        })),
      characters: characters.map((c) => ({
        id: c._id,
        name: c.name,
        voice: c.voice,
        description: c.description,
      })),
      agent: agent ? { slug: agent.slug, name: agent.name, avatar_url: agent.avatarUrl } : null,
    }
  },
})

export const sitemapData = query({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db
      .query('books')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .collect()
    const agents = await ctx.db.query('agents').collect()

    const chapters = []
    for (const b of books) {
      const chs = await ctx.db
        .query('chapters')
        .withIndex('by_book', (q) => q.eq('bookId', b._id))
        .collect()
      for (const c of chs) {
        chapters.push({
          book_slug: b.slug,
          number: c.number,
          updated_at: new Date(c.updatedAt).toISOString(),
        })
      }
    }

    return {
      books: books.map((b) => ({ slug: b.slug, updated_at: new Date(b.updatedAt).toISOString() })),
      agents: agents.map((a) => ({ slug: a.slug, created_at: new Date(a.createdAt).toISOString() })),
      chapters,
    }
  },
})
