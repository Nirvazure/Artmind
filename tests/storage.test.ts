import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import test from 'node:test'
import sharp from 'sharp'
import { getImageContentType } from '../server/utils/image-content-type'
import { saveFile, copyFromTempToArtworks } from '../server/utils/storage'

const projectUrl = 'https://storage-test.supabase.co'
const publicBase = `${projectUrl}/storage/v1/object/public/Artmind`
Object.assign(globalThis, {
  useRuntimeConfig: () => ({
    public: { supabase: { url: projectUrl } },
    supabaseServiceRoleKey: 'test-service-role',
  }),
})

test('MIME detection reads bytes and rejects invalid images', async () => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer()
  assert.equal(await getImageContentType(jpeg), 'image/jpeg')
  await assert.rejects(getImageContentType(Buffer.from('not an image')))
})

test('save uploads actual image MIME to Artmind without overwrite and propagates errors', async (t) => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: 'red' } })
    .jpeg()
    .toBuffer()
  const requests: Array<{ url: string; options: RequestInit }> = []
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options: RequestInit) => {
    requests.push({ url: String(url), options })
    return new Response(JSON.stringify({ Key: 'Artmind/temp/mismatch.png' }), { status: 200 })
  })
  assert.equal(await saveFile(jpeg, 'mismatch.png'), `${publicBase}/temp/mismatch.png`)
  assert.equal(requests.length, 1)
  assert.equal(requests[0]!.url, `${projectUrl}/storage/v1/object/Artmind/temp/mismatch.png`)
  const headers = new Headers(requests[0]!.options.headers)
  assert.equal(headers.get('content-type'), 'image/jpeg')
  assert.equal(headers.get('x-upsert'), 'false')
  await assert.rejects(saveFile(Buffer.from('bad image'), 'bad.jpg'))
  await assert.rejects(saveFile(jpeg, '../bad.jpg'))
  assert.equal(requests.length, 1)
  t.mock.method(
    globalThis,
    'fetch',
    async () =>
      new Response(JSON.stringify({ statusCode: '403', error: 'Forbidden', message: 'denied' }), {
        status: 403,
      }),
  )
  await assert.rejects(saveFile(jpeg, 'failed.jpg'), /denied/)
})

test('copy uses the storage copy operation and leaves unrelated URLs unchanged', async (t) => {
  const requests: Array<{ url: string; options: RequestInit }> = []
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options: RequestInit) => {
    requests.push({ url: String(url), options })
    return new Response(JSON.stringify({ Key: 'Artmind/artworks/a.jpg' }), { status: 200 })
  })
  assert.equal(
    await copyFromTempToArtworks(`${publicBase}/temp/a.jpg`),
    `${publicBase}/artworks/a.jpg`,
  )
  assert.equal(requests.length, 1)
  assert.equal(requests[0]!.url, `${projectUrl}/storage/v1/object/copy`)
  assert.deepEqual(JSON.parse(String(requests[0]!.options.body)), {
    bucketId: 'Artmind',
    sourceKey: 'temp/a.jpg',
    destinationKey: 'artworks/a.jpg',
  })
  for (const url of [
    'https://external.example/temp/a.jpg',
    `${publicBase}/artworks/a.jpg`,
    `${publicBase}/temp/../a.jpg`,
  ]) {
    assert.equal(await copyFromTempToArtworks(url), url)
  }
  assert.equal(requests.length, 1)
})

test('large PNG uploads retain the compressed JPEG MIME despite the original suffix', async (t) => {
  const png = await sharp(randomBytes(1024 * 1024 * 3), {
    raw: { width: 1024, height: 1024, channels: 3 },
  })
    .png()
    .toBuffer()
  assert.ok(png.length > 1024 * 1024)
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, options: RequestInit) => {
    assert.equal(new Headers(options.headers).get('content-type'), 'image/jpeg')
    assert.equal(await getImageContentType(options.body as Buffer), 'image/jpeg')
    return new Response(JSON.stringify({ Key: 'Artmind/artworks/large.png' }), { status: 200 })
  })
  assert.equal(await saveFile(png, 'large.png', 'artworks'), `${publicBase}/artworks/large.png`)
})

test('copy retries succeed only when the existing destination has identical content', async (t) => {
  let destination = 'same image bytes'
  const methods: string[] = []
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, options: RequestInit) => {
    methods.push(options.method ?? 'GET')
    if (String(url).endsWith('/object/copy')) {
      return new Response(
        JSON.stringify({
          statusCode: '409',
          error: 'Duplicate',
          message: 'The resource already exists',
        }),
        { status: 409 },
      )
    }
    return new Response(String(url).includes('/temp/') ? 'same image bytes' : destination, {
      status: 200,
    })
  })
  assert.equal(
    await copyFromTempToArtworks(`${publicBase}/temp/retry.jpg`),
    `${publicBase}/artworks/retry.jpg`,
  )
  destination = 'different image bytes'
  await assert.rejects(
    copyFromTempToArtworks(`${publicBase}/temp/retry.jpg`),
    /already exists|different|conflict/i,
  )
  assert.ok(methods.every((method) => method === 'POST' || method === 'GET'))
})

test('copy propagates non-conflict storage failures', async (t) => {
  let requests = 0
  t.mock.method(globalThis, 'fetch', async () => {
    requests++
    return new Response(
      JSON.stringify({ statusCode: '403', error: 'Forbidden', message: 'copy denied' }),
      { status: 403 },
    )
  })
  await assert.rejects(copyFromTempToArtworks(`${publicBase}/temp/a.jpg`), /copy denied/)
  assert.equal(requests, 1)
})

test('legacy duplicate responses also require matching source and destination bytes', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request) => {
    if (String(url).endsWith('/object/copy')) {
      return new Response(
        JSON.stringify({
          statusCode: '400',
          error: 'Duplicate',
          message: 'The resource already exists',
        }),
        { status: 400 },
      )
    }
    return new Response('same image', { status: 200 })
  })
  assert.equal(
    await copyFromTempToArtworks(`${publicBase}/temp/legacy.jpg`),
    `${publicBase}/artworks/legacy.jpg`,
  )
})
