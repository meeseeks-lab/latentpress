import { v } from 'convex/values'
import { internalMutation, internalQuery } from './_generated/server'
import { Doc, DataModel, Id } from './_generated/dataModel'
import { GenericMutationCtx } from 'convex/server'
import { bookBySlug, countWords, deleteBookCascade, DOC_TYPES } from './latentpressLib'
import { findInvalidVoiceTags, isKnownVoice, suggestVoices } from './voiceTags'

type MutationCtx = GenericMutationCtx<DataModel>

// Maintenance helpers for the latentpress tables. internalMutation keeps these off the
// public HTTP surface — run them from the Convex dashboard or `npx convex run`.

async function purgeBook(ctx: MutationCtx, bookId: Id<'latentpress_books'>): Promise<number> {
  const book = await ctx.db.get(bookId)
  if (!book) return 0
  return await deleteBookCascade(ctx, book)
}

// Books published before publishedAt existed carry no stamp. The book's updatedAt is the
// closest thing on record: a published book that nobody has patched since keeps its
// publish-time updatedAt. Approximate on purpose, and only fills in nulls.
export const backfillPublishedAt = internalMutation({
  args: {},
  handler: async (ctx) => {
    const published = await ctx.db
      .query('latentpress_books')
      .withIndex('by_status', (q) => q.eq('status', 'published'))
      .collect()
    const missing = published.filter((b) => !b.publishedAt)
    for (const book of missing) await ctx.db.patch(book._id, { publishedAt: book.updatedAt })
    return { published: published.length, backfilled: missing.length }
  },
})

export const deleteBookBySlug = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await ctx.db
      .query('latentpress_books')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!book) return { error: 'not_found' as const }

    const chapters = await purgeBook(ctx, book._id)
    return { success: true, deleted: { book: slug, chapters } }
  },
})

export const deleteAgentBySlug = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const agent = await ctx.db
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return { error: 'not_found' as const }

    const books = await ctx.db
      .query('latentpress_books')
      .withIndex('by_agent', (q) => q.eq('agentId', agent._id))
      .collect()
    for (const book of books) await purgeBook(ctx, book._id)

    await ctx.db.delete(agent._id)
    return { success: true, deleted: { agent: slug, books: books.length } }
  },
})

// Slug-less rows can't be addressed by slug; delete those by id.
export const deleteAgentById = internalMutation({
  args: { id: v.id('latentpress_agents') },
  handler: async (ctx, { id }) => {
    const agent = await ctx.db.get(id)
    if (!agent) return { error: 'not_found' as const }

    const books = await ctx.db
      .query('latentpress_books')
      .withIndex('by_agent', (q) => q.eq('agentId', id))
      .collect()
    for (const book of books) await purgeBook(ctx, book._id)

    await ctx.db.delete(id)
    return { success: true, deleted: { agent: agent.name, books: books.length } }
  },
})

export const deleteBookById = internalMutation({
  args: { id: v.id('latentpress_books') },
  handler: async (ctx, { id }) => {
    const book = await ctx.db.get(id)
    if (!book) return { error: 'not_found' as const }

    const chapters = await purgeBook(ctx, id)
    return { success: true, deleted: { book: book.title, chapters } }
  },
})

export const reviewsForBook = internalQuery({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }

    const reviews = await ctx.db
      .query('latentpress_reviews')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .order('desc')
      .collect()

    return {
      book: book.title,
      reviews: reviews.map((r) => ({
        id: r._id,
        name: r.name,
        body: r.body,
        hidden: r.hiddenAt !== undefined,
        created_at: new Date(r.createdAt).toISOString(),
      })),
    }
  },
})

export const hideReview = internalMutation({
  args: { id: v.id('latentpress_reviews') },
  handler: async (ctx, { id }) => {
    const review = await ctx.db.get(id)
    if (!review) return { error: 'not_found' as const }

    await ctx.db.patch(id, { hiddenAt: Date.now() })
    return { success: true, hidden: id }
  },
})

export const unhideReview = internalMutation({
  args: { id: v.id('latentpress_reviews') },
  handler: async (ctx, { id }) => {
    const review = await ctx.db.get(id)
    if (!review) return { error: 'not_found' as const }

    await ctx.db.patch(id, { hiddenAt: undefined })
    return { success: true, visible: id }
  },
})

// Hard delete. This frees the reviewer's dedupe key, so the same browser can file
// another report for this book. Prefer hideReview for abuse.
export const deleteReview = internalMutation({
  args: { id: v.id('latentpress_reviews') },
  handler: async (ctx, { id }) => {
    const review = await ctx.db.get(id)
    if (!review) return { error: 'not_found' as const }

    await ctx.db.delete(id)
    return { success: true, deleted: id }
  },
})

export const slugless = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('latentpress_agents').collect()
    const books = await ctx.db.query('latentpress_books').collect()
    return {
      agents: agents.filter((a) => !a.slug?.trim()).map((a) => ({ id: a._id, name: a.name })),
      books: books.filter((b) => !b.slug?.trim()).map((b) => ({ id: b._id, title: b.title })),
    }
  },
})

export const updateAgentProfile = internalMutation({
  args: {
    slug: v.string(),
    name: v.optional(v.string()),
    bio: v.optional(v.string()),
    homepage: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, { slug, name, bio, homepage }) => {
    const agent = await ctx.db
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return { error: 'not_found' as const }

    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (name !== undefined) patch.name = name
    if (bio !== undefined) patch.bio = bio
    if (homepage !== undefined) patch.homepage = homepage
    await ctx.db.patch(agent._id, patch)
    return { success: true }
  },
})

export const setAgentAvatar = internalMutation({
  args: { slug: v.string(), avatarUrl: v.string() },
  handler: async (ctx, { slug, avatarUrl }) => {
    const agent = await ctx.db
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return { error: 'not_found' as const }

    await ctx.db.patch(agent._id, { avatarUrl, updatedAt: Date.now() })
    return { success: true }
  },
})

export const setBookCover = internalMutation({
  args: { slug: v.string(), coverUrl: v.string() },
  handler: async (ctx, { slug, coverUrl }) => {
    const book = await ctx.db
      .query('latentpress_books')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!book) return { error: 'not_found' as const }

    await ctx.db.patch(book._id, { coverUrl, updatedAt: Date.now() })
    return { success: true }
  },
})

// Owner API key per book/agent, for server-side maintenance that goes through the
// normal HTTP API rather than writing to the tables directly.
export const ownerKeys = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('latentpress_agents').collect()
    const byId = new Map(agents.map((a) => [a._id, a]))
    const books = await ctx.db.query('latentpress_books').collect()

    return {
      agents: agents
        .filter((a) => !a.avatarUrl && a.apiKey)
        .map((a) => ({ slug: a.slug, apiKey: a.apiKey })),
      books: books
        .filter((b) => !b.coverUrl)
        .map((b) => ({ slug: b.slug, apiKey: b.agentId ? (byId.get(b.agentId)?.apiKey ?? null) : null })),
    }
  },
})

export const generateUploadUrl = internalMutation({
  args: {},
  handler: async (ctx) => ({ uploadUrl: await ctx.storage.generateUploadUrl() }),
})

// Point a book cover / agent avatar at a file already in Convex storage.
export const attachCover = internalMutation({
  args: { slug: v.string(), storageId: v.id('_storage') },
  handler: async (ctx, { slug, storageId }) => {
    const book = await ctx.db
      .query('latentpress_books')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!book) return { error: 'not_found' as const }

    const url = await ctx.storage.getUrl(storageId)
    if (!url) return { error: 'storage_missing' as const }

    if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId)
    await ctx.db.patch(book._id, { coverUrl: url, coverStorageId: storageId, updatedAt: Date.now() })
    return { success: true, url }
  },
})

export const attachAvatar = internalMutation({
  args: { slug: v.string(), storageId: v.id('_storage') },
  handler: async (ctx, { slug, storageId }) => {
    const agent = await ctx.db
      .query('latentpress_agents')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!agent) return { error: 'not_found' as const }

    const url = await ctx.storage.getUrl(storageId)
    if (!url) return { error: 'storage_missing' as const }

    await ctx.db.patch(agent._id, { avatarUrl: url, updatedAt: Date.now() })
    return { success: true, url }
  },
})

export const setBookLanguage = internalMutation({
  args: { slug: v.string(), language: v.string() },
  handler: async (ctx, { slug, language }) => {
    const book = await ctx.db
      .query('latentpress_books')
      .withIndex('by_slug', (q) => q.eq('slug', slug))
      .unique()
    if (!book) return { error: 'not_found' as const }
    await ctx.db.patch(book._id, { language, updatedAt: Date.now() })
    return { success: true, slug, language }
  },
})

// Slug-addressed maintenance writes mirroring the public API's mutation logic
// (books.ts/chapters.ts/documents.ts), for finishing books directly without
// extracting an agent's apiKey into an external shell.

export const upsertChapter = internalMutation({
  args: {
    slug: v.string(),
    number: v.number(),
    title: v.optional(v.string()),
    content: v.string(),
  },
  handler: async (ctx, { slug, number, title, content }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const invalidTags = findInvalidVoiceTags(content)
    if (invalidTags.length > 0) return { error: 'invalid_voice_tag' as const, tags: invalidTags }

    const existing = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()

    const now = Date.now()
    const patch = {
      title: title || `Chapter ${number}`,
      content,
      wordCount: countWords(content),
      updatedAt: now,
    }

    let id: Id<'latentpress_chapters'>
    if (existing) {
      await ctx.db.patch(existing._id, patch)
      id = existing._id
    } else {
      id = await ctx.db.insert('latentpress_chapters', {
        bookId: book._id,
        number,
        audioUrl: null,
        audioStatus: null,
        createdAt: now,
        ...patch,
      })
    }

    await ctx.db.patch(book._id, { updatedAt: now })
    const chapter = await ctx.db.get(id)
    return { success: true, number: chapter!.number, wordCount: chapter!.wordCount }
  },
})

export const removeChapter = internalMutation({
  args: { slug: v.string(), number: v.number() },
  handler: async (ctx, { slug, number }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const chapter = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }
    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)
    await ctx.db.delete(chapter._id)
    return { success: true }
  },
})

export const updateDoc = internalMutation({
  args: { slug: v.string(), type: v.string(), content: v.string() },
  handler: async (ctx, { slug, type, content }) => {
    if (!DOC_TYPES.includes(type)) return { error: 'invalid_type' as const }
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }

    const existing = await ctx.db
      .query('latentpress_documents')
      .withIndex('by_book_type', (q) => q.eq('bookId', book._id).eq('type', type))
      .unique()

    const now = Date.now()
    if (existing) {
      await ctx.db.patch(existing._id, { content, updatedAt: now })
    } else {
      await ctx.db.insert('latentpress_documents', { bookId: book._id, type, content, updatedAt: now })
    }
    return { success: true }
  },
})

export const addCharacter = internalMutation({
  args: { slug: v.string(), name: v.string(), description: v.optional(v.string()), voice: v.optional(v.string()) },
  handler: async (ctx, { slug, name, description, voice }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    if (voice && !isKnownVoice(voice)) return { error: 'invalid_voice' as const, suggestions: suggestVoices(voice) }

    const existing = await ctx.db
      .query('latentpress_characters')
      .withIndex('by_book_name', (q) => q.eq('bookId', book._id).eq('name', name))
      .unique()

    if (existing) {
      await ctx.db.patch(existing._id, { description: description ?? existing.description, voice: voice ?? existing.voice })
    } else {
      await ctx.db.insert('latentpress_characters', {
        bookId: book._id,
        name,
        description: description ?? null,
        voice: voice ?? null,
        createdAt: Date.now(),
      })
    }
    return { success: true }
  },
})

export const updateBookMeta = internalMutation({
  args: {
    slug: v.string(),
    title: v.optional(v.string()),
    blurb: v.optional(v.string()),
    genre: v.optional(v.array(v.string())),
  },
  handler: async (ctx, { slug, title, blurb, genre }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const patch: Record<string, unknown> = { updatedAt: Date.now() }
    if (title !== undefined) patch.title = title
    if (blurb !== undefined) patch.blurb = blurb
    if (genre !== undefined) patch.genre = genre
    await ctx.db.patch(book._id, patch)
    return { success: true }
  },
})

export const removeCharacter = internalMutation({
  args: { slug: v.string(), name: v.string() },
  handler: async (ctx, { slug, name }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const character = await ctx.db
      .query('latentpress_characters')
      .withIndex('by_book_name', (q) => q.eq('bookId', book._id).eq('name', name))
      .unique()
    if (!character) return { error: 'character_not_found' as const }
    await ctx.db.delete(character._id)
    return { success: true }
  },
})

export const setChapterAudio = internalMutation({
  args: { slug: v.string(), number: v.number(), storageId: v.id('_storage') },
  handler: async (ctx, { slug, number, storageId }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const chapter = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()
    if (!chapter) return { error: 'chapter_not_found' as const }

    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)
    const url = await ctx.storage.getUrl(storageId)
    await ctx.db.patch(chapter._id, { audioStorageId: storageId, audioUrl: url, updatedAt: Date.now() })
    return { success: true, url }
  },
})

export const publishBook = internalMutation({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return { error: 'not_found' as const }
    const chapters = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    if (chapters.length === 0) return { error: 'no_chapters' as const }
    await ctx.db.patch(book._id, { status: 'published', updatedAt: Date.now() })
    return { success: true, chapter_count: chapters.length }
  },
})

export const inventory = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('latentpress_agents').collect()
    const books = await ctx.db.query('latentpress_books').collect()
    return {
      agents: agents.map((a: Doc<'latentpress_agents'>) => ({
        slug: a.slug,
        name: a.name,
        avatarUrl: a.avatarUrl,
      })),
      books: books.map((b: Doc<'latentpress_books'>) => ({
        slug: b.slug,
        title: b.title,
        coverUrl: b.coverUrl,
        status: b.status,
      })),
    }
  },
})

// Storage URLs embed the deployment hostname, so a snapshot restored into another
// deployment keeps pointing at the old one. Re-derive each url from its storage id.
// Deliberately leaves updatedAt alone: the bytes did not change.

export const rewriteAvatarUrls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('latentpress_agents').collect()
    let updated = 0
    for (const agent of agents) {
      if (!agent.avatarStorageId) continue
      const url = await ctx.storage.getUrl(agent.avatarStorageId)
      if (!url || url === agent.avatarUrl) continue
      await ctx.db.patch(agent._id, { avatarUrl: url })
      updated++
    }
    return { checked: agents.length, updated }
  },
})

export const rewriteCoverUrls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const books = await ctx.db.query('latentpress_books').collect()
    let updated = 0
    for (const book of books) {
      if (!book.coverStorageId) continue
      const url = await ctx.storage.getUrl(book.coverStorageId)
      if (!url || url === book.coverUrl) continue
      await ctx.db.patch(book._id, { coverUrl: url })
      updated++
    }
    return { checked: books.length, updated }
  },
})

export const rewriteAudioUrls = internalMutation({
  args: {},
  handler: async (ctx) => {
    const chapters = await ctx.db.query('latentpress_chapters').collect()
    let updated = 0
    for (const chapter of chapters) {
      if (!chapter.audioStorageId) continue
      const url = await ctx.storage.getUrl(chapter.audioStorageId)
      if (!url || url === chapter.audioUrl) continue
      await ctx.db.patch(chapter._id, { audioUrl: url })
      updated++
    }
    return { checked: chapters.length, updated }
  },
})

// Health check for the storage url fields. `unbacked` is the one that matters after a
// snapshot restore: a url pointing into storage whose row carries no storage id, so
// rewrite* can't fix it and the file is invisible to any file-by-file sweep.

export const storageUrlAudit = internalQuery({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query('latentpress_agents').collect()
    const books = await ctx.db.query('latentpress_books').collect()
    const chapters = await ctx.db.query('latentpress_chapters').collect()

    const looksHosted = (url: string | null) => !!url && url.includes('/api/storage/')

    const audit = async (
      rows: { url: string | null; storageId?: Id<'_storage'> | null }[]
    ) => {
      let unbacked = 0
      let mismatched = 0
      let missingFile = 0
      let external = 0
      let empty = 0
      for (const row of rows) {
        if (!row.url) {
          empty++
          continue
        }
        if (!looksHosted(row.url)) {
          external++
          continue
        }
        if (!row.storageId) {
          unbacked++
          continue
        }
        const current = await ctx.storage.getUrl(row.storageId)
        if (!current) missingFile++
        else if (current !== row.url) mismatched++
      }
      return { total: rows.length, unbacked, mismatched, missingFile, external, empty }
    }

    return {
      agents: await audit(
        agents.map((a) => ({ url: a.avatarUrl, storageId: a.avatarStorageId }))
      ),
      books: await audit(
        books.map((b) => ({ url: b.coverUrl, storageId: b.coverStorageId }))
      ),
      chapters: await audit(
        chapters.map((c) => ({ url: c.audioUrl, storageId: c.audioStorageId }))
      ),
    }
  },
})

// Recompute wordCount on every chapter with the current countWords. Needed once after the
// CJK-aware counting landed: chapters written before it carry whitespace-split counts.
export const recountWords = internalMutation({
  args: { slug: v.optional(v.string()) },
  handler: async (ctx, { slug }) => {
    let chapters = await ctx.db.query('latentpress_chapters').collect()
    if (slug) {
      const book = await bookBySlug(ctx, slug)
      if (!book) return { error: 'not_found' as const }
      chapters = chapters.filter((c) => c.bookId === book._id)
    }
    let changed = 0
    for (const chapter of chapters) {
      const wordCount = countWords(chapter.content ?? '')
      if (wordCount === chapter.wordCount) continue
      await ctx.db.patch(chapter._id, { wordCount })
      changed++
    }
    return { scanned: chapters.length, changed }
  },
})
