import { KEREMBERKE_TO_STYLE } from '../../utils/style-labels'
import type {
  ArtSource,
  PainterKnowledge,
  PainterPortrait,
  StyleKnowledge,
} from '../../types/art-knowledge'

export interface KnowledgeSnapshot {
  styles: Record<string, StyleKnowledge>
  painters: PainterKnowledge[]
}

type Row = Record<string, unknown>
function row(value: unknown): Row {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw Error('Invalid knowledge row')
  return value as Row
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) throw Error('Empty knowledge text')
  return value
}
function https(value: unknown): string {
  const url = text(value)
  if (new URL(url).protocol !== 'https:') throw Error('Invalid knowledge URL')
  return url
}
function date(value: unknown): string {
  const result = text(value)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(result) || new Date(result).toISOString().slice(0, 10) !== result)
    throw Error('Invalid verification date')
  return result
}
function array(value: unknown): unknown[] {
  if (!Array.isArray(value)) throw Error('Invalid knowledge array')
  return value
}
function source(value: unknown): ArtSource {
  const item = row(value)
  return { title: text(item.title), institution: text(item.institution), url: https(item.url) }
}
function sources(value: unknown): ArtSource[] {
  const result = array(value).map(source)
  if (!result.length) throw Error('Knowledge sources required')
  return result
}
function portrait(value: unknown): PainterPortrait | undefined {
  if (value == null) return undefined
  const item = row(value)
  return {
    url: https(item.url),
    source: source(item.source),
    license: text(item.license),
    credit: text(item.credit),
  }
}
function order(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0)
    throw Error('Invalid knowledge order')
  return value
}
function styleName(value: unknown) {
  const id = text(value)
  if (!Object.hasOwn(KEREMBERKE_TO_STYLE, id)) throw Error('Unknown model style')
  return KEREMBERKE_TO_STYLE[id as keyof typeof KEREMBERKE_TO_STYLE]
}

/** Validate database output before replacing the last successful cache. No content fallback. */
export function mapKnowledgeRows(value: unknown): KnowledgeSnapshot {
  const result = row(value)
  const styles: Record<string, StyleKnowledge> = {}
  for (const item of array(result.styles).map(row)) {
    const name = styleName(item.id)
    if (styles[name]) throw Error('Duplicate knowledge style')
    const characteristics = array(item.characteristics).map(text)
    if (characteristics.length < 3 || characteristics.length > 5)
      throw Error('Invalid characteristic count')
    const summary = text(item.summary)
    if ([...summary].length < 100 || [...summary].length > 180)
      throw Error('Invalid summary length')
    styles[name] = {
      name,
      englishName: text(item.english_name),
      era: text(item.era),
      summary,
      characteristics,
      representativePainters: [],
      sources: sources(item.sources),
      verifiedAt: date(item.verified_at),
    }
  }
  if (Object.keys(styles).length !== Object.keys(KEREMBERKE_TO_STYLE).length)
    throw Error('Incomplete knowledge styles')
  const painterNames = new Set<string>()
  const painters = array(result.painters)
    .map(row)
    .sort((a, b) => order(a.sort_order) - order(b.sort_order))
    .map((item): PainterKnowledge => {
      order(item.sort_order)
      const name = text(item.name)
      if (painterNames.has(name)) throw Error('Duplicate painter key')
      painterNames.add(name)
      if (typeof item.verified !== 'boolean') throw Error('Invalid verification state')
      return {
        name,
        displayName: text(item.display_name),
        style: styleName(item.style_id),
        era: text(item.era),
        bio: text(item.bio),
        verified: item.verified,
        verificationNote: text(item.verification_note),
        sources: sources(item.sources),
        verifiedAt: date(item.verified_at),
        portrait: portrait(item.portrait),
      }
    })
  if (!painters.length) throw Error('Incomplete painter directory')
  const relationships = new Set<string>()
  for (const item of array(result.representatives)
    .map(row)
    .sort((a, b) => order(a.sort_order) - order(b.sort_order))) {
    order(item.sort_order)
    const name = styleName(item.style_id)
    const painter = text(item.painter_name)
    const key = `${name}\0${painter}`
    if (!painterNames.has(painter) || relationships.has(key))
      throw Error('Invalid representative relationship')
    relationships.add(key)
    styles[name]!.representativePainters.push(painter)
  }
  if (Object.values(styles).some((style) => !style.representativePainters.length))
    throw Error('Incomplete representative relationships')
  return { styles, painters }
}

export interface KnowledgeCacheResult<T> {
  data: T
  fetchedAt: number
  state: 'fresh' | 'stale'
}

/** Process-local cache: coalesce reads, refresh after 5m, bound outage fallback to 30m. */
export function createKnowledgeCache<T>(load: () => Promise<T>, now = Date.now) {
  let last: { data: T; fetchedAt: number } | undefined
  let pending: Promise<KnowledgeCacheResult<T>> | undefined
  return function get(): Promise<KnowledgeCacheResult<T>> {
    if (last && now() - last.fetchedAt < 5 * 60_000)
      return Promise.resolve({ ...last, state: 'fresh' })
    if (pending) return pending
    pending = (async () => {
      try {
        const data = await load()
        last = { data, fetchedAt: now() }
        return { ...last, state: 'fresh' as const }
      } catch (error) {
        if (last && now() - last.fetchedAt <= 30 * 60_000)
          return { ...last, state: 'stale' as const }
        throw error
      } finally {
        pending = undefined
      }
    })()
    return pending
  }
}
