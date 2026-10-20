import type { PainterKnowledge, StyleKnowledge } from '~/types/art-knowledge'
import {
  KNOWLEDGE_FRESH_MS,
  KNOWLEDGE_MAX_AGE_MS,
  createKnowledgeSnapshot,
  knowledgeIsUsable,
  knowledgeNeedsRefresh,
  retainKnowledgeAfterFailure,
  type KnowledgeSnapshot,
} from '~/utils/art-knowledge-cache'

// One expiration timer per Nuxt app/key, including while all cards are unmounted.
const memoryClocks = new WeakMap<
  object,
  Map<string, { timer?: ReturnType<typeof setTimeout>; consumers: number }>
>()

function useKnowledgeRequest<T>(key: string, endpoint: string, empty: () => T) {
  const snapshot = useState<KnowledgeSnapshot<T> | null>(`${key}-memory`, () => null)
  const now = useState<number>(`${key}-clock`, () => Date.now())
  const app = useNuxtApp()
  let clocks = memoryClocks.get(app)
  if (!clocks) {
    clocks = new Map()
    memoryClocks.set(app, clocks)
  }
  let clock = clocks.get(key)
  if (!clock) {
    clock = { consumers: 0 }
    clocks.set(key, clock)
  }
  const sharedClock = clock
  const request = useAsyncData(
    key,
    async () => {
      try {
        const response = await $fetch.raw<T>(endpoint)
        const next = createKnowledgeSnapshot(
          response._data as T,
          response.headers.get('X-Art-Knowledge-State'),
          response.headers.get('X-Art-Knowledge-Fetched-At'),
          Date.now(),
          response.headers.get('Date'),
        )
        if (!knowledgeIsUsable(next, Date.now())) throw new Error('资料缓存已超过有效期')
        snapshot.value = next
        return next
      } catch (error) {
        const message = error instanceof Error ? error.message : '资料加载失败'
        const retained = retainKnowledgeAfterFailure(snapshot.value, message, Date.now())
        snapshot.value = retained
        if (!retained) throw error
        return retained
      } finally {
        now.value = Date.now()
        scheduleExpiry()
      }
    },
    { lazy: true, server: false, immediate: false },
  )

  // useAsyncData shares a key across all consumers; defer reuses the active request.
  const refresh = () => request.refresh({ dedupe: 'defer' })
  function scheduleExpiry() {
    if (!import.meta.client) return
    if (sharedClock.timer) clearTimeout(sharedClock.timer)
    now.value = Date.now()
    const current = snapshot.value
    if (!current) return
    if (!knowledgeIsUsable(current, now.value)) {
      snapshot.value = null
      request.data.value = null
      if (sharedClock.consumers) void refresh()
      return
    }
    const freshBoundary = current.fetchedAt + KNOWLEDGE_FRESH_MS
    const nextBoundary =
      now.value < freshBoundary ? freshBoundary : current.fetchedAt + KNOWLEDGE_MAX_AGE_MS
    sharedClock.timer = setTimeout(scheduleExpiry, Math.max(1, nextBoundary - now.value))
  }
  onMounted(() => {
    sharedClock.consumers++
    now.value = Date.now()
    if (knowledgeNeedsRefresh(snapshot.value, now.value)) void refresh()
    scheduleExpiry()
  })
  onBeforeUnmount(() => {
    sharedClock.consumers = Math.max(0, sharedClock.consumers - 1)
  })
  const usable = computed(() => knowledgeIsUsable(snapshot.value, now.value))
  return {
    data: computed(() => (usable.value ? snapshot.value!.data : empty())),
    pending: request.pending,
    error: computed(() => snapshot.value?.error ?? request.error.value),
    stale: computed(
      () =>
        usable.value &&
        (snapshot.value!.stale || now.value - snapshot.value!.fetchedAt >= KNOWLEDGE_FRESH_MS),
    ),
    refresh,
  }
}

/** Nuxt 按 key 共享缓存；知识资料异步加载，不阻塞分析或作品列表。 */
export function useArtKnowledge() {
  const styleRequest = useKnowledgeRequest<Record<string, StyleKnowledge>>(
    'art-style-knowledge',
    '/api/style-knowledge',
    () => ({}),
  )
  const painterRequest = useKnowledgeRequest<PainterKnowledge[]>(
    'art-painter-knowledge',
    '/api/painters',
    () => [],
  )

  return {
    styles: computed(() => styleRequest.data.value ?? {}),
    painters: computed(() => painterRequest.data.value ?? []),
    stylesPending: styleRequest.pending,
    paintersPending: painterRequest.pending,
    stylesError: styleRequest.error,
    paintersError: painterRequest.error,
    stylesStale: styleRequest.stale,
    paintersStale: painterRequest.stale,
    refreshStyles: styleRequest.refresh,
    refreshPainters: painterRequest.refresh,
  }
}
