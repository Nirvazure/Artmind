import assert from 'node:assert/strict'
import test from 'node:test'
import { createKnowledgeCache, mapKnowledgeRows } from '../server/utils/knowledge-core'
import { KEREMBERKE_TO_STYLE } from '../utils/style-labels'

const source = {
  title: 'Example source',
  institution: 'Example museum',
  url: 'https://example.org/art',
}
const date = '2026-10-20'
function rows() {
  return {
    styles: Object.keys(KEREMBERKE_TO_STYLE).map((id) => ({
      id,
      english_name: id,
      era: '示例时期',
      summary: '虚构测试简介'.repeat(20),
      characteristics: ['示例特征一', '示例特征二', '示例特征三'],
      sources: [source],
      verified_at: date,
    })),
    painters: [
      {
        name: '测试旧名称',
        display_name: '测试展示名称',
        style_id: 'Impressionism',
        era: '示例年代',
        bio: '虚构的测试生平',
        verified: true,
        verification_note: '虚构的核验说明',
        sources: [source],
        verified_at: date,
        sort_order: 0,
        portrait: {
          url: 'https://example.org/portrait.webp',
          source,
          license: 'CC0',
          credit: 'Example',
          bytes: 1234,
          sha256: 'a'.repeat(64),
          objectKey: 'painters/example.webp',
        },
      },
    ],
    representatives: Object.keys(KEREMBERKE_TO_STYLE).map((style_id) => ({
      style_id,
      painter_name: '测试旧名称',
      sort_order: 0,
    })),
  }
}

test('数据库资料映射保留API格式、历史姓名、代表关系与顺序，隐藏头像校验字段', () => {
  const result = mapKnowledgeRows(rows())
  assert.equal(Object.keys(result.styles).length, 27)
  assert.equal(result.styles['印象派']?.name, '印象派')
  assert.deepEqual(result.styles['印象派']?.representativePainters, ['测试旧名称'])
  assert.equal(result.painters[0]?.displayName, '测试展示名称')
  assert.equal(result.painters[0]?.name, '测试旧名称')
  assert.equal(result.painters[0]?.style, '印象派')
  assert.ok(!('bytes' in result.painters[0]!.portrait!))
  assert.ok(!('sha256' in result.painters[0]!.portrait!))
})

test('拒绝未知流派、遗漏规范卡、损坏来源及悬空代表关系，不缓存不完整资料', () => {
  const unknown = rows()
  unknown.styles[0]!.id = 'Unknown'
  assert.throws(() => mapKnowledgeRows(unknown))
  const missing = rows()
  missing.styles.pop()
  assert.throws(() => mapKnowledgeRows(missing))
  const broken = rows()
  broken.painters[0]!.sources = [{ ...source, url: 'javascript:bad' }]
  assert.throws(() => mapKnowledgeRows(broken))
  const orphan = rows()
  orphan.representatives[0]!.painter_name = '不存在的测试画家'
  assert.throws(() => mapKnowledgeRows(orphan))
  const noPainters = rows()
  noPainters.painters = []
  noPainters.representatives = []
  assert.throws(() => mapKnowledgeRows(noPainters))
  const noRepresentatives = rows()
  noRepresentatives.representatives.pop()
  assert.throws(() => mapKnowledgeRows(noRepresentatives))
  const invalidOrder = rows()
  invalidOrder.painters[0]!.sort_order = -1
  assert.throws(() => mapKnowledgeRows(invalidOrder))
})

test('缓存5分钟且并发合并，过期刷新后从后台数据更新', async () => {
  let now = 0
  let calls = 0
  const cache = createKnowledgeCache(
    async () => {
      calls++
      await Promise.resolve()
      return calls
    },
    () => now,
  )
  const first = await Promise.all([cache(), cache(), cache()])
  assert.deepEqual(
    first.map((r) => r.data),
    [1, 1, 1],
  )
  assert.equal(calls, 1)
  now = 299999
  assert.equal((await cache()).data, 1)
  now = 300000
  assert.equal((await cache()).data, 2)
  assert.equal(calls, 2)
})

test('首次失败或超过30分钟失败时抛错，短期旧缓存有stale标识且恢复可刷新', async () => {
  let now = 0
  let fail = true
  const cache = createKnowledgeCache(
    async () => {
      if (fail) throw Error('offline')
      return now
    },
    () => now,
  )
  await assert.rejects(cache(), /offline/)
  fail = false
  assert.equal((await cache()).data, 0)
  fail = true
  now = 300000
  assert.deepEqual(await cache(), { data: 0, fetchedAt: 0, state: 'stale' })
  now = 1800001
  await assert.rejects(cache(), /offline/)
  fail = false
  assert.equal((await cache()).data, now)
})
