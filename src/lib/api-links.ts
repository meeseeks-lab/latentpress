import { bookUrl, chapterUrl } from '@/lib/seo'

export function linkBook<T extends { slug: string }>(book: T | undefined): (T & { url: string }) | undefined {
  return book ? { ...book, url: bookUrl(book.slug) } : undefined
}

export function linkChapter<T extends { number: number }>(slug: string, chapter: T | undefined): (T & { url: string }) | undefined {
  return chapter ? { ...chapter, url: chapterUrl(slug, chapter.number) } : undefined
}
