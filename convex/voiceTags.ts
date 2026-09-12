import { EDGE_TTS_VOICES } from './voices'

export const VOICE_TAG = /^\[([A-Z_]+)\]$/
const BRACKETED_LINE = /^\[\S+\]$/
const INLINE_VOICE_TAG = /\[([A-Z_]+)\]\s*/g

export const NARRATOR_TAG = 'NARRATOR'

export interface NarrationWarnings {
  unregisteredTags: string[]
  charactersWithoutVoice: string[]
}

function lines(content: string): string[] {
  return content.split('\n').map((line) => line.trim())
}

export function extractVoiceTags(content: string): string[] {
  const tags = new Set<string>()
  for (const line of lines(content)) {
    const match = VOICE_TAG.exec(line)
    if (match) tags.add(match[1])
  }
  return [...tags]
}

export function findInvalidVoiceTags(content: string): string[] {
  const invalid = new Set<string>()
  for (const line of lines(content)) {
    if (BRACKETED_LINE.test(line) && !VOICE_TAG.test(line)) invalid.add(line)
  }
  return [...invalid]
}

export function stripVoiceTags(content: string): string {
  return content.replace(INLINE_VOICE_TAG, '')
}

export function isKnownVoice(voice: string): boolean {
  return EDGE_TTS_VOICES.includes(voice)
}

export function suggestVoices(voice: string, limit = 8): string[] {
  const locale = voice.split('-').slice(0, 2).join('-').toLowerCase()
  const lang = voice.split('-')[0].toLowerCase()
  const byLocale = EDGE_TTS_VOICES.filter((id) => id.toLowerCase().startsWith(`${locale}-`))
  const byLang = EDGE_TTS_VOICES.filter((id) => id.toLowerCase().startsWith(`${lang}-`))
  return (byLocale.length > 0 ? byLocale : byLang).slice(0, limit)
}

export function narrationWarnings(
  content: string,
  characters: { name: string; voice: string | null }[]
): string[] {
  const tags = extractVoiceTags(content)
  if (tags.length === 0) return []
  const byName = new Map(characters.map((c) => [c.name, c]))
  const unregistered = tags.filter((tag) => !byName.has(tag))
  const voiceless = tags.filter((tag) => byName.has(tag) && !byName.get(tag)!.voice)
  const narratorVoice = byName.get(NARRATOR_TAG)?.voice ?? null
  const fallback = narratorVoice
    ? `Until then narrate.js reads them in ${NARRATOR_TAG}'s voice (${narratorVoice}).`
    : `${NARRATOR_TAG} has no voice either, so narrate.js falls back to the first edge-tts voice for the book's language.`
  const warnings: string[] = []
  if (unregistered.length > 0) {
    warnings.push(`Voice tags with no registered character: ${unregistered.join(', ')}. Register them with add-character. ${fallback}`)
  }
  if (voiceless.length > 0) {
    warnings.push(`Characters used in this chapter but without a voice: ${voiceless.join(', ')}. Set one with add-character. ${fallback}`)
  }
  return warnings
}
