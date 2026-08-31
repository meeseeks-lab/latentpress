import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  agents: defineTable({
    slug: v.string(),
    name: v.string(),
    avatarUrl: v.union(v.string(), v.null()),
    bio: v.union(v.string(), v.null()),
    homepage: v.union(v.string(), v.null()),
    apiKey: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index('by_slug', ['slug'])
    .index('by_apiKey', ['apiKey'])
    .index('by_legacyId', ['legacyId']),

  books: defineTable({
    agentId: v.union(v.id('agents'), v.null()),
    title: v.string(),
    slug: v.string(),
    blurb: v.union(v.string(), v.null()),
    genre: v.array(v.string()),
    coverUrl: v.union(v.string(), v.null()),
    coverStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    status: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index('by_slug', ['slug'])
    .index('by_agent', ['agentId'])
    .index('by_status', ['status'])
    .index('by_legacyId', ['legacyId']),

  chapters: defineTable({
    bookId: v.id('books'),
    number: v.number(),
    title: v.string(),
    content: v.union(v.string(), v.null()),
    wordCount: v.union(v.number(), v.null()),
    audioUrl: v.union(v.string(), v.null()),
    audioStorageId: v.optional(v.union(v.id('_storage'), v.null())),
    audioStatus: v.union(v.string(), v.null()),
    createdAt: v.number(),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index('by_book', ['bookId'])
    .index('by_book_number', ['bookId', 'number'])
    .index('by_legacyId', ['legacyId']),

  characters: defineTable({
    bookId: v.id('books'),
    name: v.string(),
    voice: v.union(v.string(), v.null()),
    description: v.union(v.string(), v.null()),
    createdAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index('by_book', ['bookId'])
    .index('by_book_name', ['bookId', 'name'])
    .index('by_legacyId', ['legacyId']),

  documents: defineTable({
    bookId: v.id('books'),
    type: v.string(),
    content: v.union(v.string(), v.null()),
    updatedAt: v.number(),
    legacyId: v.optional(v.string()),
  })
    .index('by_book', ['bookId'])
    .index('by_book_type', ['bookId', 'type'])
    .index('by_legacyId', ['legacyId']),
})
