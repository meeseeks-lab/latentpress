import { v } from 'convex/values'
import { mutation, query, QueryCtx } from './_generated/server'
import { agentByApiKey, bookBySlug, deleteBookCascade, slugify, DOC_TYPES } from './latentpressLib'
import { Doc } from './_generated/dataModel'

function shape(book: Doc<'latentpress_books'>) {
  return {
    id: book._id,
    title: book.title,
    slug: book.slug,
    blurb: book.blurb,
    genre: book.genre,
    language: book.language ?? 'en',
    cover_url: book.coverUrl,
    status: book.status,
    published_at: book.publishedAt ? new Date(book.publishedAt).toISOString() : null,
    created_at: new Date(book.createdAt).toISOString(),
    updated_at: new Date(book.updatedAt).toISOString(),
  }
}

async function withProgress(ctx: QueryCtx, book: Doc<'latentpress_books'>) {
  const chapters = await ctx.db
    .query('latentpress_chapters')
    .withIndex('by_book', (q) => q.eq('bookId', book._id))
    .collect()
  const highest = chapters.reduce((max, c) => Math.max(max, c.number), 0)
  return {
    ...shape(book),
    chapter_count: chapters.length,
    highest_chapter: highest,
    next_chapter: highest + 1,
  }
}

export const create = mutation({
  args: {
    apiKey: v.string(),
    title: v.string(),
    slug: v.optional(v.string()),
    blurb: v.optional(v.string()),
    genre: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
    coverUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const bookSlug = args.slug || slugify(args.title)
    const existing = await bookBySlug(ctx, bookSlug)
    if (existing) return { error: 'conflict' as const, slug: bookSlug }

    const now = Date.now()
    const id = await ctx.db.insert('latentpress_books', {
      agentId: agent._id,
      title: args.title.trim(),
      slug: bookSlug,
      blurb: args.blurb ?? null,
      genre: args.genre ?? [],
      language: args.language ?? 'en',
      coverUrl: args.coverUrl ?? null,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
    })

    for (const type of DOC_TYPES) {
      await ctx.db.insert('latentpress_documents', { bookId: id, type, content: '', updatedAt: now })
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
      .query('latentpress_books')
      .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
      .order('desc')
      .collect()

    const enriched = []
    for (const b of books) enriched.push(await withProgress(ctx, b))
    return { books: enriched }
  },
})

export const getForAgent = query({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    return { book: await withProgress(ctx, book) }
  },
})

export const update = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    title: v.optional(v.string()),
    blurb: v.optional(v.string()),
    genre: v.optional(v.array(v.string())),
    language: v.optional(v.string()),
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
    if (args.language !== undefined) patch.language = args.language
    if (args.coverUrl !== undefined) patch.coverUrl = args.coverUrl
    if (Object.keys(patch).length === 0) return { error: 'no_fields' as const }

    patch.updatedAt = Date.now()
    await ctx.db.patch(book._id, patch)
    const updated = await ctx.db.get(book._id)
    return { book: shape(updated!) }
  },
})

export const remove = mutation({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const chapters = await deleteBookCascade(ctx, book)
    return { deleted: { book: slug, chapters } }
  },
})

// The shelf shows a cover and an author face next to every book. Missing ones fall back
// to placeholders, which is fine for a draft and looks unfinished once published.
function shelfWarnings(book: Doc<'latentpress_books'>, agent: Doc<'latentpress_agents'>): string[] {
  const warnings: string[] = []
  if (!book.coverUrl) {
    warnings.push(`"${book.title}" is on the shelf without a cover. Generate a 3:4 portrait and send it with set-cover ${book.slug} --file cover.png.`)
  }
  if (!agent.avatarUrl) {
    warnings.push(`Your author page shows the default face. Generate a 1:1 portrait for ${agent.name} and send it with set-avatar --file avatar.png.`)
  }
  return warnings
}

export const publish = mutation({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const chapters = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    if (chapters.length === 0) return { error: 'no_chapters' as const }

    const now = Date.now()
    await ctx.db.patch(book._id, { status: 'published', publishedAt: book.publishedAt ?? now, updatedAt: now })
    const updated = await ctx.db.get(book._id)
    return { book: shape(updated!), chapter_count: chapters.length, warnings: shelfWarnings(updated!, agent) }
  },
})

export const listPublished = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const books = await ctx.db
      .query('latentpress_books')
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
      ctx.db.query('latentpress_books').collect(),
      ctx.db.query('latentpress_chapters').collect(),
      ctx.db.query('latentpress_agents').collect(),
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
      ctx.db.query('latentpress_chapters').withIndex('by_book', (q) => q.eq('bookId', book._id)).collect(),
      ctx.db.query('latentpress_characters').withIndex('by_book', (q) => q.eq('bookId', book._id)).collect(),
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
      .query('latentpress_books')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .collect()
    const agents = await ctx.db.query('latentpress_agents').collect()

    const chapters = []
    for (const b of books) {
      const chs = await ctx.db
        .query('latentpress_chapters')
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
