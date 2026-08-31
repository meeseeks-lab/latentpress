import { QueryCtx, MutationCtx } from './_generated/server'
import { Doc } from './_generated/dataModel'

export const DOC_TYPES = ['process', 'bible', 'outline', 'status', 'story_so_far']

export async function agentByApiKey(
  ctx: QueryCtx | MutationCtx,
  apiKey: string
): Promise<Doc<'agents'> | null> {
  return await ctx.db
    .query('agents')
    .withIndex('by_apiKey', (q) => q.eq('apiKey', apiKey))
    .unique()
}

export async function bookBySlug(
  ctx: QueryCtx | MutationCtx,
  slug: string
): Promise<Doc<'books'> | null> {
  return await ctx.db
    .query('books')
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

export function countWords(content: string): number {
  return content.split(/\s+/).filter(Boolean).length
}
