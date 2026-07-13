import assert from 'node:assert/strict'
import test from 'node:test'

import { normalizeArtworkTitle, shouldSendBackgroundNotification } from '../utils/analysis-helpers'
import {
  getDefaultPaintersForStyle,
  getPainterOptionsByStyle,
  normalizePaintersInput,
} from '../utils/painter-options'

const painterCatalog = [
  { name: '达芬奇', style: '盛期文艺复兴' },
  { name: '拉斐尔', style: '盛期文艺复兴' },
  { name: '米开朗琪罗', style: '盛期文艺复兴' },
  { name: '提香', style: '盛期文艺复兴' },
  { name: '梵高', style: '后印象派' },
]

test('空标题会被归一化为空字符串', () => {
  assert.equal(normalizeArtworkTitle(undefined), '')
  assert.equal(normalizeArtworkTitle('   '), '')
  assert.equal(normalizeArtworkTitle('  星夜  '), '星夜')
})

test('只有页面隐藏且通知已授权时才发送后台提醒', () => {
  assert.equal(
    shouldSendBackgroundNotification({ permission: 'granted', visibilityState: 'hidden' }),
    true,
  )
  assert.equal(
    shouldSendBackgroundNotification({ permission: 'granted', visibilityState: 'visible' }),
    false,
  )
  assert.equal(
    shouldSendBackgroundNotification({ permission: 'default', visibilityState: 'hidden' }),
    false,
  )
})

test('切换真实流派时按该流派候选与默认画家重置', () => {
  assert.deepEqual(getPainterOptionsByStyle('盛期文艺复兴', painterCatalog), [
    '达芬奇',
    '拉斐尔',
    '米开朗琪罗',
    '提香',
  ])
  assert.deepEqual(getDefaultPaintersForStyle('盛期文艺复兴', painterCatalog), [
    '达芬奇',
    '拉斐尔',
    '米开朗琪罗',
  ])
  assert.deepEqual(getDefaultPaintersForStyle('不存在的流派', painterCatalog), [])
})

test('画家输入会去重并忽略空白值', () => {
  assert.deepEqual(normalizePaintersInput([' 梵高 ', '', '高更', '梵高']), ['梵高', '高更'])
})
