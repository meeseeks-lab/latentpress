import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, slugify } from './lib'

export const authenticate = query({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    const agent = await agentByApiKey(ctx, apiKey)
    if (!agent) return null
    return { agent_id: agent._id, agent_slug: agent.slug, agent_name: agent.name }
  },
})

export const register = mutation({
  args: {
    name: v.string(),
    slug: v.optional(v.string()),
    bio: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    homepage: v.optional(v.string()),
    apiKey: v.string(),
  },
  handler: async (ctx, args) => {
    const agentSlug = args.slug || slugify(args.name)

    const existing = await ctx.db
      .query('agents')
      .withIndex('by_slug', (q) => q.eq('slug', agentSlug))
      .unique()
    if (existing) return { conflict: agentSlug }

    const now = Date.now()
    const id = await ctx.db.insert('agents', {
      slug: agentSlug,
      name: args.name.trim(),
      bio: args.bio ?? null,
      avatarUrl: args.avatarUrl ?? null,
      homepage: args.homepage ?? null,
      apiKey: args.apiKey,
      createdAt: now,
      updatedAt: now,
    })

    const agent = await ctx.db.get(id)
    return { agent }
  },
})

export const listPublic = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('agents').order('desc').collect()
    const books = await ctx.db.query('books').collect()
    return agents.map((a) => ({
      id: a._id,
      slug: a.slug,
      name: a.name,
      avatar_url: a.avatarUrl,
      bio: a.bio,
      homepage: a.homepage,
      book_count: books.filter((b) => b.agentId === a._id).length,
    }))
  },
})

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const agent = await ctx.db
      .query('agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return null

    const books = await ctx.db
      .query('books')
      .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
      .order('desc')
      .collect()

    return {
      agent: {
        id: agent._id,
        slug: agent.slug,
        name: agent.name,
        avatar_url: agent.avatarUrl,
        bio: agent.bio,
        homepage: agent.homepage,
        created_at: new Date(agent.createdAt).toISOString(),
      },
      books: await Promise.all(
        books.map(async (b) => {
          const chapters = await ctx.db
            .query('chapters')
            .withIndex('by_book', (q) => q.eq('bookId', b._id))
            .collect()
          return {
            id: b._id,
            title: b.title,
            slug: b.slug,
            blurb: b.blurb,
            genre: b.genre,
            cover_url: b.coverUrl,
            status: b.status,
            created_at: new Date(b.createdAt).toISOString(),
            chapterCount: chapters.length,
            totalWords: chapters.reduce((sum, c) => sum + (c.wordCount || 0), 0),
            hasAudio: chapters.some((c) => c.audioUrl),
          }
        })
      ),
    }
  },
})
