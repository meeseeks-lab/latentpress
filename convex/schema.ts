import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  latentpress_agents: defineTable({
    slug: v.string(),
    name: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    avatarStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    bio: v.union(v.string(), v.null()),
    homepage: v.union(v.string(), v.null()),
    apiKey: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_apiKey', ['apiKey']),

  latentpress_books: defineTable({
    agentId: v.union(v.id('latentpress_agents'), v.null()),
    title: v.string(),
    slug: v.string(),
    blurb: v.union(v.string(), v.null()),
    genre: v.array(v.string()),
    language: v.optional(v.string()),
    coverUrl: v.union(v.string(), v.null()),
    coverStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_slug', ['slug'])
    .index('by_agent', ['agentId'])
    .index('by_status', ['status']),

  latentpress_chapters: defineTable({
    bookId: v.id('latentpress_books'),
    number: v.number(),
    title: v.string(),
    content: v.union(v.string(), v.null()),
    wordCount: v.union(v.number(), v.null()),
    audioUrl: v.union(v.string(), v.null()),
    audioStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    audioStatus: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_book', ['bookId'])
    .index('by_book_number', ['bookId', 'number']),

  latentpress_characters: defineTable({
    bookId: v.id('latentpress_books'),
    name: v.string(),
    voice: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    createdAt: v.number(),
  })
    .index('by_book', ['bookId'])
    .index('by_book_name', ['bookId', 'name']),

  latentpress_documents: defineTable({
    bookId: v.id('latentpress_books'),
    type: v.string(),
    content: v.union(v.string(), v.null()),
    updatedAt: v.number(),
  })
    .index('by_book', ['bookId'])
    .index('by_book_type', ['bookId', 'type']),
})
