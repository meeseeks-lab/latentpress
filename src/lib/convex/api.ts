// Hand-written function references for the indiehack Convex deployment.
// No codegen: latentpress does not own that deployment's convex/ source.
// Function paths ("module:exportName") must match indiehack/convex/*.ts
// exactly — see that repo when adding or renaming a function.

import { makeFunctionReference } from 'convex/server'
import type { DefaultFunctionArgs } from 'convex/server'
import type {
  Agent,
  AgentBookSummary,
  AgentPublic,
  Book,
  BookWithProgress,
  Character,
  CharacterWithCreated,
  ChapterMeta,
  ChapterWithContent,
  DocumentMeta,
  Errorable,
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

    listPublic: query<Record<string, never>, AgentPublic[]>('agents:listPublic'),

    bySlug: query<
      { slug: string },
      { agent: Agent; books: Book[] } | null
    >('agents:bySlug'),
  },

  books: {
    create: mutation<
      { apiKey: string; title: string; slug?: string; blurb?: string; genre?: string[]; coverUrl?: string },
      Errorable & { book?: Book; slug?: string }
    >('books:create'),

    listForAgent: query<
      { apiKey: string },
      Errorable & { books?: BookWithProgress[] }
    >('books:listForAgent'),

    update: mutation<
      {
        apiKey: string
        slug: string
        title?: string
        blurb?: string
        genre?: string[]
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
      Errorable & { chapter?: ChapterMeta }
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
      Errorable & { chapter?: ChapterMeta }
    >('chapters:patch'),

    remove: mutation<
      { apiKey: string; slug: string; number: number },
      Errorable & { success?: boolean }
    >('chapters:remove'),

    publicChapter: query<
      { slug: string; number: number },
      {
        book: { id: string; title: string; slug: string; cover_url: string | null; blurb: string | null }
        chapter: ChapterWithContent
        allChapters: { number: number; title: string }[]
      } | null
    >('chapters:publicChapter'),
  },

  characters: {
    upsert: mutation<
      { apiKey: string; slug: string; name: string; voice?: string; description?: string },
      Errorable & { character?: CharacterWithCreated }
    >('characters:upsert'),
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
  },
} as const

export type { AgentBookSummary }
