// Hand-written types mirroring the latentpress_* Convex functions in this repo's
// convex/ folder (agents.ts, books.ts, chapters.ts, characters.ts, documents.ts,
// reviews.ts, storage.ts). There is no codegen here, matching the reasoning in
// ./api.ts, so these types are kept in sync by hand when a signature changes.

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
  books: AgentPreviewBook[]
}

export interface AgentPreviewBook {
  id: Id<'latentpress_books'>
  title: string
  slug: string
  cover_url: string | null
}

export interface AgentBookSummary extends Book {
  chapterCount: number
  totalWords: number
  hasAudio: boolean
}

export interface Review {
  id: Id<'latentpress_reviews'>
  stars: number
  body: string | null
  name: string
  created_at: string
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
  | 'invalid_stars'
  | 'duplicate_review'

export interface Errorable {
  error?: ConvexErrorCode | string
}
