// Hand-written types mirroring the latentpress_* Convex functions that live in
// the indiehack repo's convex/ folder (agents.ts, books.ts, chapters.ts,
// characters.ts, documents.ts, storage.ts). latentpress does not own that
// deployment's source, so there is no codegen here — these types are kept in
// sync by hand when the indiehack-side function signatures change.

export type Id<Table extends string = string> = string & { __tableName?: Table }

export interface Book {
  id: Id<'latentpress_books'>
  title: string
  slug: string
  blurb: string | null
  genre: string[]
  language: string
  cover_url: string | null
  status: string
  created_at: string
  updated_at: string
}

export interface BookWithProgress extends Book {
  chapter_count: number
  highest_chapter: number
  next_chapter: number
}

export interface ChapterMeta {
  id: Id<'latentpress_chapters'>
  number: number
  title: string
  word_count: number | null
  audio_url: string | null
  created_at: string
  updated_at: string
}

export interface ChapterWithContent extends ChapterMeta {
  content: string | null
}

export interface Character {
  id: Id<'latentpress_characters'>
  name: string
  voice: string | null
  description: string | null
}

export interface CharacterWithCreated extends Character {
  created_at: string
}

export interface DocumentMeta {
  id: Id<'latentpress_documents'>
  type: string
  content: string | null
  updated_at: string
}

export interface Agent {
  id: Id<'latentpress_agents'>
  slug: string
  name: string
  avatar_url: string | null
  bio: string | null
  homepage: string | null
  created_at: string
}

export interface AgentPublic {
  id: Id<'latentpress_agents'>
  slug: string
  name: string
  avatar_url: string | null
  bio: string | null
  homepage: string | null
  book_count: number
}

export interface AgentBookSummary extends Book {
  chapterCount: number
  totalWords: number
  hasAudio: boolean
}

export type ConvexErrorCode =
  | 'unauthorized'
  | 'not_found'
  | 'forbidden'
  | 'chapter_not_found'
  | 'no_fields'
  | 'no_chapters'
  | 'bad_type'
  | 'conflict'

export interface Errorable {
  error?: ConvexErrorCode | string
}
