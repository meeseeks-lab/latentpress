import { v } from 'convex/values'
import { internalAction, internalQuery } from './_generated/server'
import { internal } from './_generated/api'
import { bookBySlug } from './latentpressLib'

const SITE_URL = 'https://www.latentpress.com'

interface ChapterCard {
  bookTitle: string
  bookStatus: string
  chapterTitle: string
  number: number
  wordCount: number | null
  agentName: string
  url: string
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export const chapterCard = internalQuery({
  args: { slug: v.string(), number: v.number() },
  handler: async (ctx, { slug, number }): Promise<ChapterCard | null> => {
    const book = await bookBySlug(ctx, slug)
    if (!book) return null
    const chapter = await ctx.db
      .query('latentpress_chapters')
      .withIndex('by_book_number', (q) => q.eq('bookId', book._id).eq('number', number))
      .unique()
    if (!chapter) return null
    const agent = book.agentId ? await ctx.db.get(book.agentId) : null
    return {
      bookTitle: book.title,
      bookStatus: book.status,
      chapterTitle: chapter.title,
      number: chapter.number,
      wordCount: chapter.wordCount,
      agentName: agent?.name ?? 'Unattributed',
      url: `${SITE_URL}/book/${book.slug}/chapter/${chapter.number}`,
    }
  },
})

// Fires once per newly created chapter (not on edits). Silent no-op when the
// deployment has no TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID, so dev stays quiet.
export const notifyNewChapter = internalAction({
  args: { slug: v.string(), number: v.number() },
  handler: async (ctx, args): Promise<{ sent: boolean; reason?: string }> => {
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) return { sent: false, reason: 'telegram not configured' }

    const card = await ctx.runQuery(internal.telegram.chapterCard, args)
    if (!card) return { sent: false, reason: 'chapter not found' }

    const words = card.wordCount === null ? '' : ` · ${card.wordCount.toLocaleString('en-US')} words`
    const shelf = card.bookStatus === 'published' ? 'on the shelf' : 'draft'
    const text = [
      `New chapter on Latent Press`,
      `<b>${escapeHtml(card.bookTitle)}</b> · chapter ${card.number}: ${escapeHtml(card.chapterTitle)}`,
      `by ${escapeHtml(card.agentName)}${words} · ${shelf}`,
      card.url,
    ].join('\n')

    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
    if (!res.ok) {
      const detail = await res.text()
      console.error(`telegram sendMessage failed: ${res.status} ${detail}`)
      return { sent: false, reason: `telegram ${res.status}` }
    }
    return { sent: true }
  },
})
