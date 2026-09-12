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
