import assert from 'node:assert/strict'
import test from 'node:test'

interface SessionUser {
  id: string
  user_metadata: { avatar_url: string }
}
interface Profile {
  display_name: string | null
  avatar_url: string | null
}
interface ProfileResult {
  data: Profile | null
}

let setup: () => void
Object.assign(globalThis, {
  defineNuxtPlugin: (plugin: { setup: () => void }) => {
    setup = plugin.setup
    return plugin
  },
})
await import('../plugins/auth.client')

function deferredProfile() {
  let resolve!: (result: ProfileResult) => void
  let reject!: (error: Error) => void
  const promise = new Promise<ProfileResult>((onResolve, onReject) => {
    resolve = onResolve
    reject = onReject
  })
  return { promise, resolve, reject }
}

function startAuth(profile: (id: string) => Promise<ProfileResult>) {
  const states = new Map<string, { value: unknown }>()
  const updates: string[] = []
  let onAuthStateChange!: (event: string, session: { user: SessionUser } | null) => void
  Object.assign(globalThis, {
    useState: (key: string, initial: () => unknown) => {
      if (!states.has(key)) states.set(key, { value: initial() })
      return states.get(key)
    },
    useSupabaseClient: () => ({
      auth: {
        onAuthStateChange: (callback: typeof onAuthStateChange) => {
          onAuthStateChange = callback
        },
      },
      from: () => ({
        select: () => ({
          eq: (_key: string, id: string) => ({ maybeSingle: () => profile(id) }),
        }),
        update: () => ({
          eq: async (_key: string, id: string) => {
            updates.push(id)
            return { error: null }
          },
        }),
      }),
    }),
  })
  setup()
  return {
    states,
    updates,
    emit: (event: string, id: string | null) =>
      onAuthStateChange(
        event,
        id
          ? {
              user: {
                id,
                user_metadata: { avatar_url: `https://avatars.githubusercontent.com/u/${id}` },
              },
            }
          : null,
      ),
  }
}

const flushAuth = () => new Promise<void>((resolve) => setTimeout(resolve, 5))

test('a profile read that finishes after logout cannot restore the user or sync their avatar', async () => {
  const pending = deferredProfile()
  const auth = startAuth(() => pending.promise)
  auth.emit('SIGNED_IN', '1')
  await flushAuth()
  auth.emit('SIGNED_OUT', null)
  await flushAuth()
  pending.resolve({
    data: { display_name: 'Old user', avatar_url: 'https://old.example/avatar.jpg' },
  })
  await flushAuth()
  assert.equal(auth.states.get('auth-user')?.value, null)
  assert.equal(auth.states.get('auth-synced-id')?.value, null)
  assert.equal(auth.states.get('auth-loading')?.value, false)
  assert.deepEqual(auth.updates, [])
})

test('a profile read that rejects after logout cannot restore the captured session fallback', async () => {
  const pending = deferredProfile()
  const auth = startAuth(() => pending.promise)
  auth.emit('SIGNED_IN', '1')
  await flushAuth()
  auth.emit('SIGNED_OUT', null)
  await flushAuth()
  pending.reject(new Error('Profile unavailable'))
  await flushAuth()
  assert.equal(auth.states.get('auth-user')?.value, null)
  assert.equal(auth.states.get('auth-synced-id')?.value, null)
  assert.equal(auth.states.get('auth-loading')?.value, false)
})

test('an old account profile cannot replace a later signed-in account', async () => {
  const pending = deferredProfile()
  const auth = startAuth((id) =>
    id === '1'
      ? pending.promise
      : Promise.resolve({
          data: {
            display_name: 'New user',
            avatar_url: 'https://avatars.githubusercontent.com/u/2',
          },
        }),
  )
  auth.emit('SIGNED_IN', '1')
  await flushAuth()
  auth.emit('SIGNED_IN', '2')
  await flushAuth()
  pending.resolve({
    data: { display_name: 'Old user', avatar_url: 'https://old.example/avatar.jpg' },
  })
  await flushAuth()
  assert.deepEqual(auth.states.get('auth-user')?.value, {
    id: '2',
    name: 'New user',
    photo: 'https://avatars.githubusercontent.com/u/2',
  })
  assert.equal(auth.states.get('auth-synced-id')?.value, '2')
  assert.deepEqual(auth.updates, [])
})
