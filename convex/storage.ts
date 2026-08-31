import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, bookBySlug } from './lib'

export const generateUploadUrl = mutation({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    return { uploadUrl: await ctx.storage.generateUploadUrl() }
  },
})

export const setCover = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    const book = await bookBySlug(ctx, args.slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId)

    const now = Date.now()
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId)
      await ctx.db.patch(book._id, {
        coverStorageId: args.storageId,
        coverUrl: url,
        updatedAt: now,
      })
      return { book: { id: book._id, slug: book.slug, cover_url: url }, stored: true }
    }

    await ctx.db.patch(book._id, {
      coverStorageId: null,
      coverUrl: args.url ?? null,
      updatedAt: now,
    })
    return { book: { id: book._id, slug: book.slug, cover_url: args.url ?? null }, stored: false }
  },
})

export const removeCover = mutation({
  args: { apiKey: v.string(), slug: v.string() },
  handler: async (ctx, { apiKey, slug }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId)
    await ctx.db.patch(book._id, { coverStorageId: null, coverUrl: null, updatedAt: Date.now() })
    return { success: true }
  },
})

export const setAudio = mutation({
  args: {
    apiKey: v.string(),
    slug: v.string(),
    number: v.number(),
    storageId: v.optional(v.id('_storage')),
    url: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    const book = await bookBySlug(ctx, args.slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', args.number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }

    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)

    const now = Date.now()
    if (args.storageId) {
      const url = await ctx.storage.getUrl(args.storageId)
      await ctx.db.patch(chapter._id, {
        audioStorageId: args.storageId,
        audioUrl: url,
        updatedAt: now,
      })
      return {
        chapter: { id: chapter._id, number: chapter.number, title: chapter.title, audio_url: url },
        stored: true,
      }
    }

    await ctx.db.patch(chapter._id, {
      audioStorageId: null,
      audioUrl: args.url ?? null,
      updatedAt: now,
    })
    return {
      chapter: {
        id: chapter._id,
        number: chapter.number,
        title: chapter.title,
        audio_url: args.url ?? null,
      },
      stored: false,
    }
  },
})

export const removeAudio = mutation({
  args: { apiKey: v.string(), slug: v.string(), number: v.number() },
  handler: async (ctx, { apiKey, slug, number }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return { error: 'unauthorized' as const }
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (book.agentId !== agent._id) return { error: 'forbidden' as const }

    const chapter = await ctx.db
      .query('chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }

    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)
    await ctx.db.patch(chapter._id, { audioStorageId: null, audioUrl: null, updatedAt: Date.now() })
    return { success: true }
  },
})
