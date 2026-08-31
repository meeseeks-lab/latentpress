import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, bookBySlug, countWords } from './lib'
import { Doc } from './_generated/dataModel'

function meta(c: Doc<'chapters'>) {
  return {
    id: c._id,
    number: c.number,
    title: c.title,
    word_count: c.wordCount,
    audio_url: c.audioUrl,
    created_at: new Date(c.createdAt).toISOString(),
    updated_at: new Date(c.updatedAt).toISOString(),
  }
}

type Owned =
  | { ok: false; error: 'unauthorized' | 'not_found' | 'forbidden' }
  | { ok: true; book: Doc<'books'> }

async function ownedBook(ctx: any, apiKey: string, slug: string): Promise<Owned> {
  const agent = await agentByApiKey(ctx, apiKey)
  if (!agent) return { ok: false, error: 'unauthorized' }
  const book = await bookBySlug(ctx, slug)
  if (!book) return { ok: false, error: 'not_found' }
  if (book.agentId !== agent._id) return { ok: false, error: 'forbidden' }
  return { ok: true, book }
}

export const upsert = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    number: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
    audioUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const res = await ownedBook(ctx, args.apiKey, args.slug)
    if (!res.ok) return { error: res.error }
    const { book } = res

    const existing = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', args.number))
      .unique()

    const now = Date.now()
    const patch = {
      title: args.title || `Chapter ${args.number}`,
      content: args.content,
      wordCount: countWords(args.content),
      updatedAt: now,
      ...(args.audioUrl !== undefined ? { audioUrl: args.audioUrl } : {}),
    }

    let id
    if (existing) {
      await ctx.db.patch(existing._id, patch)
      id = existing._id
    } else {
      id = await ctx.db.insert('chapters', {
        bookId: book._id,
        number: args.number,
        audioUrl: args.audioUrl ?? null,
        audioStatus: null,
        createdAt: now,
        ...patch,
      })
    }

    await ctx.db.patch(book._id, { updatedAt: now })
    const chapter = await ctx.db.get(id)
    return { chapter: meta(chapter!) }
  },
})

export const list = query({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const res = await ownedBook(ctx, apiKey, slug)
    if (!res.ok) return { error: res.error }
    const chapters = await ctx.db
      .query('chapters')
      .withIndex('by_book', (q) => q.eq('bookId', res.book._id))
      .collect()
    return { chapters: chapters.sort((a, b) => a.number - b.number).map(meta) }
  },
})

export const get = query({
  args: { apiKey: v.string(), slug: v.string(), number: v.number() },
  handler: async (ctx, { apiKey, slug, number }) => {
    const res = await ownedBook(ctx, apiKey, slug)
    if (!res.ok) return { error: res.error }
    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', res.book._id).eq('number', number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }
    return { chapter: { ...meta(chapter), content: chapter.content } }
  },
})

export const patch = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    number: v.number(),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    audioUrl: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const res = await ownedBook(ctx, args.apiKey, args.slug)
    if (!res.ok) return { error: res.error }

    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', res.book._id).eq('number', args.number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }

    const patchData: Record<string, unknown> = {}
    if (args.title !== undefined) patchData.title = args.title
    if (args.content !== undefined) {
      patchData.content = args.content
      patchData.wordCount = countWords(args.content)
    }
    if (args.audioUrl !== undefined) patchData.audioUrl = args.audioUrl
    if (Object.keys(patchData).length === 0) return { error: 'no_fields' as const }

    patchData.updatedAt = Date.now()
    await ctx.db.patch(chapter._id, patchData)
    const updated = await ctx.db.get(chapter._id)
    return { chapter: meta(updated!) }
  },
})

export const remove = mutation({
  args: { apiKey: v.string(), slug: v.string(), number: v.number() },
  handler: async (ctx, { apiKey, slug, number }) => {
    const res = await ownedBook(ctx, apiKey, slug)
    if (!res.ok) return { error: res.error }
    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', res.book._id).eq('number', number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }
    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)
    await ctx.db.delete(chapter._id)
    return { success: true }
  },
})

export const publicChapter = query({
  args: { slug: v.string(), number: v.number() },
  handler: async (ctx, { slug, number }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null
    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()
    if (!chapter) return null
    const all = await ctx.db
      .query('chapters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    return {
      book: {
        id: book._id,
        title: book.title,
        slug: book.slug,
        cover_url: book.coverUrl,
        blurb: book.blurb,
      },
      chapter: { ...meta(chapter), content: chapter.content },
      allChapters: all
        .sort((a, b) => a.number - b.number)
        .map((c) => ({ number: c.number, title: c.title })),
    }
  },
})
