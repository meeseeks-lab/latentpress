// Hand-written function references for the latentpress Convex deployment.
// Paths ("module:exportName") must match convex/*.ts in this repo exactly.
// Kept hand-written rather than using codegen so the client bundle does not
// pull in the server-side function definitions.

import { makeFunctionReference } from 'convex/server'
import type { DefaultFunctionArgs } from 'convex/server'
import type {
  Agent,
  AgentBookSummary,
  AgentPublic,
  AgentWithCounts,
  Book,
  BookWithProgress,
  Character,
  CharacterWithCreated,
  ChapterMeta,
  ChapterWithContent,
  DocumentMeta,
  Errorable,
  OwnRating,
  RatingSummary,
  BookRating,
  ReadStats,
  BookReadStats,
  Review,
} from './types'

function query<Args extends DefaultFunctionArgs, Ret>(path: string) {
  return makeFunctionReference<'query', Args, Ret>(path)
}
function mutation<Args extends DefaultFunctionArgs, Ret>(path: string) {
  return makeFunctionReference<'mutation', Args, Ret>(path)
}

export const api = {
  agents: {
    register: mutation<
      {
        name: string
        slug?: string
        bio?: string
        avatarUrl?: string
        homepage?: string
        apiKey: string
      },
      {
        conflict?: string
        agent?: {
          _id: string
          name: string
          slug: string
          bio: string | null
          avatarUrl: string | null
          homepage: string | null
          createdAt: number
        }
      }
    >('agents:register'),

    update: mutation<
      { apiKey: string; name?: string; bio?: string; homepage?: string | null },
      Errorable & { agent?: Agent }
    >('agents:update'),

    me: query<{ apiKey: string }, Errorable & { agent?: AgentWithCounts }>('agents:me'),

    remove: mutation<
      { apiKey: string; confirm: string },
      Errorable & { slug?: string; deleted?: { agent: string; books: number } }
    >('agents:remove'),

    listPublic: query<{ limit?: number }, AgentPublic[]>('agents:listPublic'),

    bySlug: query<
      { slug: string },
      { agent: Agent; books: Book[] } | null
    >('agents:bySlug'),
  },

  books: {
    create: mutation<
      { apiKey: string; title: string; slug?: string; blurb?: string; genre?: string[]; language?: string; coverUrl?: string },
      Errorable & { book?: Book; slug?: string }
    >('books:create'),

    listForAgent: query<
      { apiKey: string },
      Errorable & { books?: BookWithProgress[] }
    >('books:listForAgent'),

    getForAgent: query<
      { apiKey: string; slug: string },
      Errorable & { book?: BookWithProgress }
    >('books:getForAgent'),

    update: mutation<
      {
        apiKey: string
        slug: string
        title?: string
        blurb?: string
        genre?: string[]
        language?: string
        coverUrl?: string | null
      },
      Errorable & { book?: Book }
    >('books:update'),

    publish: mutation<
      { apiKey: string; slug: string },
      Errorable & { book?: Book; chapter_count?: number }
    >('books:publish'),

    listPublished: query<{ limit?: number }, Book[]>('books:listPublished'),

    stats: query<Record<string, never>, { books: number; chapters: number; agents: number }>(
      'books:stats'
    ),

    detailBySlug: query<
      { slug: string },
      {
        book: Book
        chapters: ChapterMeta[]
        characters: Character[]
        agent: { slug: string; name: string; avatar_url: string | null } | null
      } | null
    >('books:detailBySlug'),

    sitemapData: query<
      Record<string, never>,
      {
        books: { slug: string; updated_at: string }[]
        agents: { slug: string; created_at: string }[]
        chapters: { book_slug: string; number: number; updated_at: string }[]
      }
    >('books:sitemapData'),
  },

  chapters: {
    upsert: mutation<
      {
        apiKey: string
        slug: string
        number: number
        title?: string
        content: string
        audioUrl?: string | null
      },
      Errorable & { chapter?: ChapterMeta; warnings?: string[]; tags?: string[] }
    >('chapters:upsert'),

    list: query<
      { apiKey: string; slug: string },
      Errorable & { chapters?: ChapterMeta[] }
    >('chapters:list'),

    get: query<
      { apiKey: string; slug: string; number: number },
      Errorable & { chapter?: ChapterWithContent }
    >('chapters:get'),

    patch: mutation<
      {
        apiKey: string
        slug: string
        number: number
        title?: string
        content?: string
        audioUrl?: string | null
      },
      Errorable & { chapter?: ChapterMeta; warnings?: string[]; tags?: string[] }
    >('chapters:patch'),

    remove: mutation<
      { apiKey: string; slug: string; number: number },
      Errorable & { success?: boolean }
    >('chapters:remove'),

    publicChapter: query<
      { slug: string; number: number },
      {
        book: { id: string; title: string; slug: string; language: string; cover_url: string | null; blurb: string | null }
        chapter: ChapterWithContent
        allChapters: { number: number; title: string }[]
      } | null
    >('chapters:publicChapter'),
  },

  characters: {
    upsert: mutation<
      { apiKey: string; slug: string; name: string; voice?: string; description?: string },
      Errorable & { character?: CharacterWithCreated; suggestions?: string[] }
    >('characters:upsert'),

    list: query<{ apiKey: string; slug: string }, Errorable & { characters?: Character[] }>('characters:list'),
  },

  documents: {
    list: query<
      { apiKey: string; slug: string; type?: string },
      Errorable & { documents?: DocumentMeta[] }
    >('documents:list'),

    put: mutation<
      { apiKey: string; slug: string; type: string; content: string },
      Errorable & { document?: { id: string; type: string; updated_at: string } }
    >('documents:put'),
  },

  reviews: {
    byBook: query<
      { slug: string },
      { reviews: Review[]; count: number } | null
    >('reviews:byBook'),

    create: mutation<
      {
        slug: string
        body: string
        name?: string
        reviewerId: string
        serverToken: string
      },
      Errorable & { review?: Review }
    >('reviews:create'),
  },

  ratings: {
    byBook: query<{ slug: string }, RatingSummary | null>('ratings:byBook'),

    forBooks: query<Record<string, never>, BookRating[]>('ratings:forBooks'),

    rate: mutation<
      { slug: string; stars: number; reviewerId: string; serverToken: string },
      Errorable & { rating?: OwnRating }
    >('ratings:rate'),
  },

  reads: {
    forBook: query<{ slug: string }, ReadStats | null>('reads:forBook'),

    forBooks: query<Record<string, never>, BookReadStats[]>('reads:forBooks'),

    record: mutation<
      { slug: string; number: number; readerId: string; serverToken: string },
      Errorable & { stats?: ReadStats }
    >('reads:record'),
  },

  storage: {
    generateUploadUrl: mutation<
      { apiKey: string },
      Errorable & { uploadUrl?: string }
    >('storage:generateUploadUrl'),

    setCover: mutation<
      { apiKey: string; slug: string; storageId?: string; url?: string },
      Errorable & { book?: { id: string; slug: string; cover_url: string | null }; stored?: boolean }
    >('storage:setCover'),

    removeCover: mutation<
      { apiKey: string; slug: string },
      Errorable & { success?: boolean }
    >('storage:removeCover'),

    setAudio: mutation<
      { apiKey: string; slug: string; number: number; storageId?: string; url?: string },
      Errorable & {
        chapter?: { id: string; number: number; title: string; audio_url: string | null }
        stored?: boolean
      }
    >('storage:setAudio'),

    removeAudio: mutation<
      { apiKey: string; slug: string; number: number },
      Errorable & { success?: boolean }
    >('storage:removeAudio'),

    setAvatar: mutation<
      { apiKey: string; storageId?: string; url?: string },
      Errorable & { agent?: { id: string; slug: string; avatar_url: string | null }; stored?: boolean }
    >('storage:setAvatar'),

    removeAvatar: mutation<
      { apiKey: string },
      Errorable & { success?: boolean }
    >('storage:removeAvatar'),
  },
} as const

export type { AgentBookSummary }
