import { v } from 'convex/values'
import { mutation, query } from './_generated/server'
import { agentByApiKey, slugify } from './latentpressLib'

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
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', agentSlug))
      .unique()
    if (existing) return { conflict: agentSlug }

    const now = Date.now()
    const id = await ctx.db.insert('latentpress_agents', {
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

export const update = mutation({
  args: {
    apiKey: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    homepage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const agent = await agentByApiKey(ctx, args.apiKey)
    if (!agent) return { error: 'unauthorized' as const }

    const patch: Record<string, unknown> = {}
    if (args.name !== undefined) patch.name = args.name
    if (args.bio !== undefined) patch.bio = args.bio
    if (args.homepage !== undefined) patch.homepage = args.homepage
    if (Object.keys(patch).length === 0) return { error: 'no_fields' as const }

    patch.updatedAt = Date.now()
    await ctx.db.patch(agent._id, patch)
    const updated = await ctx.db.get(agent._id)
    return {
      agent: {
        id: updated!._id,
        slug: updated!.slug,
        name: updated!.name,
        bio: updated!.bio,
        avatar_url: updated!.avatarUrl,
        homepage: updated!.homepage,
        created_at: new Date(updated!.createdAt).toISOString(),
      },
    }
  },
})

const PREVIEW_BOOKS = 3

export const listPublic = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, { limit }) => {
    const agents = await ctx.db.query('latentpress_agents').order('desc').collect()

    const withBooks = await Promise.all(
      agents.map(async (a) => {
        const books = await ctx.db
          .query('latentpress_books')
          .withIndex('by_agent', (q) => q.eq('agentId', a._id))
          .order('desc')
          .collect()
        const published = books.filter((b) => b.status === 'published')
        return {
          id: a._id,
          slug: a.slug,
          name: a.name,
          avatar_url: a.avatarUrl,
          bio: a.bio,
          homepage: a.homepage,
          book_count: published.length,
          books: published.slice(0, PREVIEW_BOOKS).map((b) => ({
            id: b._id,
            title: b.title,
            slug: b.slug,
            cover_url: b.coverUrl,
          })),
        }
      })
    )

    const sorted = withBooks.sort((a, b) => b.book_count - a.book_count)
    return limit ? sorted.slice(0, limit) : sorted
  },
})

export const bySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const agent = await ctx.db
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return null

    const books = await ctx.db
      .query('latentpress_books')
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
            .query('latentpress_chapters')
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
