import assert from 'node:assert/strict'
import test from 'node:test'
import { storageAdmin } from '../scripts/lib/storage-admin'

const projectUrl = 'https://admin-test.supabase.co'
let moduleId = 0

test('server admin uses the new secret key for artmind Data API requests', async (t) => {
  // Support both Nuxt runtime config and an environment injected after build.
  const scenarios = [
    { runtime: { supabaseSecretKey: ' sb_secret_runtime ' }, env: {}, want: 'sb_secret_runtime' },
    {
      runtime: {},
      env: { SUPABASE_SECRET_KEY: ' sb_secret_deployment ' },
      want: 'sb_secret_deployment',
    },
  ]
  for (const scenario of scenarios) {
    await t.test(scenario.want, async (t) => {
      const original = process.env.SUPABASE_SECRET_KEY
      delete process.env.SUPABASE_SECRET_KEY
      Object.assign(process.env, scenario.env)
      t.after(() => {
        if (original === undefined) delete process.env.SUPABASE_SECRET_KEY
        else process.env.SUPABASE_SECRET_KEY = original
      })
      Object.assign(globalThis, {
        useRuntimeConfig: () => ({
          public: { supabase: { url: projectUrl } },
          ...scenario.runtime,
        }),
      })
      t.mock.method(
        globalThis,
        'fetch',
        async (url: string | URL | Request, options: RequestInit) => {
          assert.equal(String(url), `${projectUrl}/rest/v1/artworks?select=id&limit=1`)
          const headers = new Headers(options.headers)
          assert.equal(headers.get('apikey'), scenario.want)
          assert.equal(headers.get('accept-profile'), 'artmind')
          return new Response(JSON.stringify([{ id: 'artwork-1' }]), { status: 200 })
        },
      )
      const { getSupabaseAdmin } = await import(
        `../server/utils/supabase-admin.ts?case=${moduleId++}`
      )
      const client = getSupabaseAdmin()
      const { data, error } = await client.from('artworks').select('id').limit(1)
      assert.equal(error, null)
      assert.deepEqual(data, [{ id: 'artwork-1' }])
      assert.equal(getSupabaseAdmin(), client)
    })
  }
})

test('server admin reports the new configuration name when its key is missing', async (t) => {
  const original = process.env.SUPABASE_SECRET_KEY
  delete process.env.SUPABASE_SECRET_KEY
  t.after(() => {
    if (original === undefined) delete process.env.SUPABASE_SECRET_KEY
    else process.env.SUPABASE_SECRET_KEY = original
  })
  Object.assign(globalThis, {
    useRuntimeConfig: () => ({
      public: { supabase: { url: projectUrl } },
      supabaseSecretKey: '  ',
    }),
  })
  const { getSupabaseAdmin } = await import(`../server/utils/supabase-admin.ts?case=${moduleId++}`)
  assert.throws(getSupabaseAdmin, /SUPABASE_SECRET_KEY/)
})

test('maintenance client uses the secret key and rejects missing credentials', async (t) => {
  const originals = { ...process.env }
  t.after(() => {
    process.env = originals
  })
  // Keep the developer's local .env out of these isolated credential scenarios.
  t.mock.method(process, 'loadEnvFile', () => {})
  process.env.SUPABASE_URL = projectUrl
  process.env.SUPABASE_SECRET_KEY = ' sb_secret_maintenance '
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options: RequestInit) => {
    assert.equal(new Headers(options.headers).get('apikey'), 'sb_secret_maintenance')
    return new Response(JSON.stringify([]), { status: 200 })
  })
  const { client } = storageAdmin()
  const { data, error } = await client.storage.from('Artmind').list('temp')
  assert.equal(error, null)
  assert.deepEqual(data, [])
  delete process.env.SUPABASE_SECRET_KEY
  assert.throws(storageAdmin, /SUPABASE_SECRET_KEY/)
})
