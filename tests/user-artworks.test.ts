import assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'
import { useUserArtworks } from '../composables/useUserArtworks'

interface QueryResult {
  data: Record<string, unknown>[] | null
  error: Error | null
}

function mockClient(getResult: (table: string, id: unknown) => Promise<QueryResult>) {
  return {
    from(table: string) {
      let id: unknown
      return {
        select() {
          return this
        },
        eq(_field: string, value: unknown) {
          id = value
          return this
        },
        in() {
          return this
        },
        order() {
          return this
        },
        then(resolve: (value: QueryResult) => unknown, reject: (reason: unknown) => unknown) {
          return getResult(table, id).then(resolve, reject)
        },
      }
    },
  }
}

const row = {
  id: 'private',
  user_id: 'me',
  title: '我的作品',
  style: '印象派',
  image_url: 'private.jpg',
  image_width: 100,
  image_height: 100,
  is_public: false,
  analysis_result: null,
  created_at: '2026-10-17',
  artwork_likes: [{ user_id: 'me' }],
}
const flushRequests = () => new Promise<void>((resolve) => setImmediate(resolve))

test('logout clears personal data and ignores an earlier in-flight response', async () => {
  let finish: (value: QueryResult) => void = () => {}
  const response = new Promise<QueryResult>((resolve) => {
    finish = resolve
  })
  Object.assign(globalThis, { useSupabaseClient: () => mockClient(() => response) })
  const scope = effectScope()
  const userId = ref<string | undefined>('me')
  const state = scope.run(() => useUserArtworks(userId))!
  try {
    await flushRequests()
    assert.equal(state.loading.value, true)
    userId.value = undefined
    await nextTick()
    finish({ data: [row], error: null })
    await flushRequests()
    assert.deepEqual(state.myArtworks.value, [])
    assert.deepEqual(state.myCollectedArtworks.value, [])
    assert.equal(state.loading.value, false)
  } finally {
    scope.stop()
  }
})

test('a disabled community view performs no personal queries and reports fetch errors on activation', async () => {
  let calls = 0
  Object.assign(globalThis, {
    useSupabaseClient: () =>
      mockClient(async () => {
        calls += 1
        return { data: null, error: new Error('查询失败') }
      }),
  })
  const scope = effectScope()
  const enabled = ref(false)
  const state = scope.run(() => useUserArtworks(ref('me'), enabled))!
  try {
    await flushRequests()
    assert.equal(calls, 0)
    enabled.value = true
    await nextTick()
    await flushRequests()
    assert.equal(calls, 1)
    assert.equal(state.error.value, '查询失败')
    assert.equal(state.loading.value, false)
  } finally {
    scope.stop()
  }
})

test('personal Gallery retains private works and removes uncollected works immediately', async () => {
  Object.assign(globalThis, {
    useSupabaseClient: () =>
      mockClient(async (table) => ({
        data: table === 'artwork_likes' ? [{ artwork_id: 'private' }] : [row],
        error: null,
      })),
  })
  const scope = effectScope()
  const state = scope.run(() => useUserArtworks(ref('me')))!
  try {
    await flushRequests()
    assert.equal(state.myArtworks.value[0]?.isPublic, false)
    assert.equal(state.myCollectedArtworks.value.length, 1)
    state.updateArtwork({ ...state.myArtworks.value[0]!, isPublic: true, likes: [] })
    assert.equal(state.myArtworks.value[0]?.isPublic, true)
    assert.equal(state.myCollectedArtworks.value.length, 0)
  } finally {
    scope.stop()
  }
})
