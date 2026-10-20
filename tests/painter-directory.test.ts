import assert from 'node:assert/strict'
import test from 'node:test'
import { getTopPaintersByStyle } from '../server/utils/painter-mapping'

test('分类画家关联读取当前数据库目录，保留旧姓名键与原顺序', async () => {
  const painters = [
    { name: '测试旧姓名甲', style: '印象派' },
    { name: '测试旧姓名乙', style: '巴洛克' },
    { name: '测试旧姓名丙', style: '印象派' },
  ]
  const load = async () => ({ data: { painters } })
  assert.deepEqual(await getTopPaintersByStyle(' 印象派 ', 3, load), [
    '测试旧姓名甲',
    '测试旧姓名丙',
  ])
  painters[0]!.style = '巴洛克'
  assert.deepEqual(await getTopPaintersByStyle('印象派', 3, load), ['测试旧姓名丙'])
  assert.deepEqual(await getTopPaintersByStyle('未知', 3, load), [])
})

test('目录读取失败仅返回空画家数组，分类与保存不因知识资料不可用而抛错', async () => {
  const load = async () => {
    throw Error('offline')
  }
  assert.deepEqual(await getTopPaintersByStyle('印象派', 3, load), [])
})
