import { QueryCtx, MutationCtx } from './_generated/server'
import { Doc } from './_generated/dataModel'

export const DOC_TYPES = ['process', 'bible', 'outline', 'status', 'story_so_far']

export async function agentByApiKey(
  ctx: QueryCtx | MutationCtx,
  apiKey: string
): Promise<Doc<'latentpress_agents'> | null> {
  return await ctx.db
    .query('latentpress_agents')
    .withIndex('by_apiKey', (q) => q.eq('apiKey', apiKey))
    .unique()
}

const BOOK_CHILD_TABLES = [
  'latentpress_documents',
  'latentpress_characters',
  'latentpress_reviews',
  'latentpress_ratings',
  'latentpress_reads',
  'latentpress_book_stats',
] as const

export async function deleteBookCascade(ctx: MutationCtx, book: Doc<'latentpress_books'>): Promise<void> {
  const chapters = await ctx.db
    .query('latentpress_chapters')
    .withIndex('by_book', (q) => q.eq('bookId', book._id))
    .collect()
  for (const chapter of chapters) {
    if (chapter.audioStorageId) await ctx.storage.delete(chapter.audioStorageId)
    await ctx.db.delete(chapter._id)
  }
  for (const table of BOOK_CHILD_TABLES) {
    const rows = await ctx.db
      .query(table)
      .withIndex('by_book', (q) => q.eq('bookId', book._id))
      .collect()
    for (const row of rows) await ctx.db.delete(row._id)
  }
  if (book.coverStorageId) await ctx.storage.delete(book.coverStorageId)
  await ctx.db.delete(book._id)
}

export async function bookBySlug(
  ctx: QueryCtx | MutationCtx,
  slug: string
): Promise<Doc<'latentpress_books'> | null> {
  return await ctx.db
    .query('latentpress_books')
    .withIndex('by_slug', (q) => q.eq('slug', slug))
    .unique()
}

export function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  if (base) return base
  return `book-${Math.random().toString(36).slice(2, 10)}`
}

// CJK scripts do not separate words with spaces, so a whitespace split counts a whole
// Chinese chapter as a handful of "words". Count each CJK character as a word instead.
const CJK_CHAR = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}\p{Script=Thai}]/gu

export function countWords(content: string): number {
  const cjk = content.match(CJK_CHAR)?.length ?? 0
  const spaced = content.replace(CJK_CHAR, ' ').split(/\s+/).filter(Boolean).length
  return cjk + spaced
}
