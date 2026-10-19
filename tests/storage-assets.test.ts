import assert from 'node:assert/strict'
import test from 'node:test'
import { STORAGE_BUCKET, storageObjectKey, storagePublicUrl } from '../utils/storage-assets'

const projectUrl = 'https://example.supabase.co'

test('public URLs use the case-sensitive bucket and encode object segments once', () => {
  assert.equal(STORAGE_BUCKET, 'Artmind')
  const key = 'artworks/画 作 #1.jpg'
  const url = storagePublicUrl(`${projectUrl}/`, key)
  assert.equal(
    url,
    `${projectUrl}/storage/v1/object/public/Artmind/artworks/%E7%94%BB%20%E4%BD%9C%20%231.jpg`,
  )
  assert.equal(storageObjectKey(url, projectUrl), key)
})

test('object parsing rejects foreign projects, buckets, routes and unsafe paths', () => {
  const base = `${projectUrl}/storage/v1/object/public/Artmind/`
  for (const url of [
    'https://other.supabase.co/storage/v1/object/public/Artmind/temp/a.jpg',
    `${projectUrl}/storage/v1/object/public/artmind/temp/a.jpg`,
    `${projectUrl}/storage/v1/object/sign/Artmind/temp/a.jpg`,
    `${base}temp/../a.jpg`,
    `${base}temp/%2e%2e/a.jpg`,
    `${base}temp/%252e%252e/a.jpg`,
    `${base}temp/a%2fb.jpg`,
    `${base}temp/a%5cb.jpg`,
    `${base}temp/%ZZ.jpg`,
    `${base}temp//a.jpg`,
    `${base}temp/a.jpg?download=1`,
    `${base}temp/a.jpg#fragment`,
    `https://user@example.supabase.co/storage/v1/object/public/Artmind/temp/a.jpg`,
  ])
    assert.equal(storageObjectKey(url, projectUrl), null, url)
})

test('URL construction rejects object traversal', () => {
  for (const key of ['../a.jpg', 'temp/../a.jpg', '/temp/a.jpg', 'temp/a\\b.jpg']) {
    assert.throws(() => storagePublicUrl(projectUrl, key))
  }
})
