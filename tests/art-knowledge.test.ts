import assert from 'node:assert/strict'
import test from 'node:test'
import { findPainter, findStyleKnowledge } from '../utils/art-knowledge'

test('旧画家名称与规范展示名都能找到同一资料，自定义名称不冒用目录资料', () => {
  const catalog = [{ name: '测试旧姓名', displayName: '测试·规范展示名' }]
  assert.equal(findPainter(catalog, ' 测试旧姓名 ')?.displayName, '测试·规范展示名')
  assert.equal(findPainter(catalog, '测试·规范展示名')?.name, '测试旧姓名')
  assert.equal(findPainter(catalog, '我的朋友'), null)
  assert.equal(findPainter(catalog, ''), null)
})

test('知识卡精确跟随所选流派，未知流派不误用默认资料', () => {
  const knowledge = { 印象派: { name: '印象派' }, 后印象派: { name: '后印象派' } }
  assert.equal(findStyleKnowledge(knowledge, '印象派')?.name, '印象派')
  assert.equal(findStyleKnowledge(knowledge, ' 后印象派 ')?.name, '后印象派')
  assert.equal(findStyleKnowledge(knowledge, '不详'), null)
  assert.equal(findStyleKnowledge(knowledge, ''), null)
})
