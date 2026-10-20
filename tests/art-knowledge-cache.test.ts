import assert from 'node:assert/strict'
import test from 'node:test'
import {
  KNOWLEDGE_FRESH_MS,
  KNOWLEDGE_MAX_AGE_MS,
  createKnowledgeSnapshot,
  knowledgeNeedsRefresh,
  knowledgeIsUsable,
  retainKnowledgeAfterFailure,
} from '../utils/art-knowledge-cache'

const start = Date.parse('2026-10-20T00:00:00Z')
test('通过响应服务器时间换算缓存年龄，容忍设备时钟偏差但不延长旧缓存', () => {
  for (const offset of [-120_000, 120_000]) {
    const serverNow = start + offset
    const snapshot = createKnowledgeSnapshot(
      [],
      'stale',
      new Date(serverNow - 29 * 60_000).toISOString(),
      start,
      new Date(serverNow).toUTCString(),
    )
    assert.equal(snapshot.fetchedAt, start - 29 * 60_000)
    assert.equal(knowledgeIsUsable(snapshot, start + 59_999), true)
    assert.equal(knowledgeIsUsable(snapshot, start + 60_000), false)
  }
})
test('页面重挂载在五分钟内复用，五分钟后刷新', () => {
  const snapshot = createKnowledgeSnapshot(
    { title: '示例' },
    'fresh',
    new Date(start).toISOString(),
    start,
  )
  assert.equal(knowledgeNeedsRefresh(snapshot, start + KNOWLEDGE_FRESH_MS - 1), false)
  assert.equal(knowledgeNeedsRefresh(snapshot, start + KNOWLEDGE_FRESH_MS), true)
  assert.equal(knowledgeNeedsRefresh(null, start), true)
})
test('服务器 stale 时间以原始抓取时间计算，不能被客户端请求续期', () => {
  const sourceTime = start - 29 * 60_000
  const snapshot = createKnowledgeSnapshot(
    ['sample'],
    'stale',
    new Date(sourceTime).toISOString(),
    start,
  )
  assert.equal(snapshot.stale, true)
  assert.equal(knowledgeIsUsable(snapshot, start + 59_999), true)
  assert.equal(knowledgeIsUsable(snapshot, start + 60_000), false)
})
test('请求失败仅保留三十分钟以内的缓存，并提供局部错误状态', () => {
  const snapshot = createKnowledgeSnapshot(
    ['sample'],
    'fresh',
    new Date(start).toISOString(),
    start,
  )
  const retained = retainKnowledgeAfterFailure(snapshot, '离线', start + 6 * 60_000)
  assert.deepEqual(retained?.data, ['sample'])
  assert.equal(retained?.stale, true)
  assert.equal(retained?.error, '离线')
  assert.equal(retainKnowledgeAfterFailure(snapshot, '离线', start + KNOWLEDGE_MAX_AGE_MS), null)
})
test('空数据仍是有效缓存；缺失或损坏的服务端日期不能将旧资料续期', () => {
  const snapshot = createKnowledgeSnapshot([], 'fresh', null, start)
  assert.deepEqual(snapshot.data, [])
  assert.equal(snapshot.fetchedAt, start)
  assert.equal(createKnowledgeSnapshot([], 'stale', 'bad-date', start).fetchedAt, 0)
  assert.equal(
    knowledgeIsUsable(createKnowledgeSnapshot([], 'fresh', 'bad-date', start), start),
    false,
  )
})
