import assert from 'node:assert/strict'
import test from 'node:test'
import {
  planTempCleanup,
  sourceObjectKey,
  verifyObjectBytes,
} from '../scripts/lib/storage-maintenance'

test('migration only maps exact source URLs and preserves decoded keys', () => {
  const origin = 'https://assets.example.com'
  assert.equal(
    sourceObjectKey('https://assets.example.com/artworks/a%20b.jpg', origin),
    'artworks/a b.jpg',
  )
  assert.equal(sourceObjectKey('https://assets.example.com.evil.test/artworks/a.jpg', origin), null)
  assert.equal(sourceObjectKey('https://other.test/artworks/a.jpg', origin), null)
  assert.equal(
    sourceObjectKey('https://assets.example.com/artworks/a.jpg?x-oss-process=resize', origin),
    null,
  )
  assert.equal(sourceObjectKey('https://assets.example.com/temp/%2Fetc', origin), null)
})

test('migration rejects mismatched bytes instead of trusting equal sizes', () => {
  assert.doesNotThrow(() => verifyObjectBytes(Buffer.from('same'), Buffer.from('same')))
  assert.throws(() => verifyObjectBytes(Buffer.from('abc'), Buffer.from('xyz')), /content mismatch/)
  assert.throws(() => verifyObjectBytes(Buffer.from('a'), Buffer.from('ab')), /size mismatch/)
})

test('cleanup only selects expired temp files and protects permanent references', () => {
  const now = Date.parse('2026-10-19T12:00:00Z')
  const items = [
    { key: 'temp/expired.jpg', createdAt: '2026-10-17T12:00:00Z' },
    { key: 'temp/recent.jpg', createdAt: '2026-10-19T11:00:00Z' },
    { key: 'temp/boundary.jpg', createdAt: '2026-10-18T12:00:00Z' },
    { key: 'temp/referenced.jpg', createdAt: '2026-10-17T12:00:00Z' },
    { key: 'artworks/permanent.jpg', createdAt: '2026-10-17T12:00:00Z' },
    { key: 'temp/unknown.jpg', createdAt: null },
  ]
  const plan = planTempCleanup(items, new Set(['temp/referenced.jpg']), {}, now)
  assert.deepEqual(plan.remove, ['temp/expired.jpg'])
  assert.deepEqual(plan.protected, ['temp/referenced.jpg'])
  assert.deepEqual(plan.unknownAge, ['temp/unknown.jpg'])
})

test('cleanup uses original timestamps for copied temp files', () => {
  const plan = planTempCleanup(
    [{ key: 'temp/copied.jpg', createdAt: '2026-10-19T11:00:00Z' }],
    new Set(),
    { 'temp/copied.jpg': '2026-10-17T11:00:00Z' },
    Date.parse('2026-10-19T12:00:00Z'),
  )
  assert.deepEqual(plan.remove, ['temp/copied.jpg'])
})
