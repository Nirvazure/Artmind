export const KNOWLEDGE_FRESH_MS = 5 * 60_000
export const KNOWLEDGE_MAX_AGE_MS = 30 * 60_000

export interface KnowledgeSnapshot<T> {
  data: T
  fetchedAt: number
  checkedAt: number
  stale: boolean
  error: string | null
}

export function createKnowledgeSnapshot<T>(
  data: T,
  state: string | null,
  fetchedAt: string | null,
  now: number,
  serverDate: string | null = null,
): KnowledgeSnapshot<T> {
  const parsed = fetchedAt === null ? now : Date.parse(fetchedAt)
  const serverNow = serverDate === null ? now : Date.parse(serverDate)
  // Compare timestamps from the same clock; HTTP Date has one-second precision.
  const age = Math.max(0, serverNow - parsed)
  return {
    data,
    fetchedAt: Number.isFinite(parsed) && Number.isFinite(serverNow) ? now - age : 0,
    checkedAt: now,
    stale: state === 'stale',
    error: null,
  }
}

export function knowledgeIsUsable<T>(
  snapshot: KnowledgeSnapshot<T> | null | undefined,
  now: number,
) {
  return !!snapshot && now >= snapshot.fetchedAt && now - snapshot.fetchedAt < KNOWLEDGE_MAX_AGE_MS
}

export function knowledgeNeedsRefresh<T>(
  snapshot: KnowledgeSnapshot<T> | null | undefined,
  now: number,
) {
  return (
    !snapshot || !knowledgeIsUsable(snapshot, now) || now - snapshot.checkedAt >= KNOWLEDGE_FRESH_MS
  )
}

export function retainKnowledgeAfterFailure<T>(
  snapshot: KnowledgeSnapshot<T> | null | undefined,
  error: string,
  now: number,
): KnowledgeSnapshot<T> | null {
  return knowledgeIsUsable(snapshot, now)
    ? { ...snapshot!, stale: true, error, checkedAt: now }
    : null
}
