import assert from 'node:assert/strict'
import test from 'node:test'

import { paintersListData } from '../server/data/painters-list'
import { getTopPaintersByStyle } from '../server/utils/painter-mapping'
import { DEFAULT_STYLE_COVER_URL, getStyleCoverMap } from '../server/utils/styles-data'
import { STYLE_NAMES, isStyleName } from '../utils/style-labels'

test('画家目录只使用 HF 规范流派', () => {
  const invalidStyles = paintersListData
    .map((item) => item.style)
    .filter((style) => !isStyleName(style))

  assert.deepEqual(invalidStyles, [])
})

test('重标后的流派仍能返回正确的默认画家', () => {
  assert.deepEqual(getTopPaintersByStyle('盛期文艺复兴', 4), [
    '达芬奇',
    '拉斐尔',
    '米开朗琪罗',
    '提香',
  ])
  assert.deepEqual(getTopPaintersByStyle('后印象派', 3), ['梵高', '高更', '保罗塞尚'])
  assert.deepEqual(getTopPaintersByStyle('立体主义', 1), ['毕加索'])
})

test('流派封面接口为每个 HF 流派提供封面', () => {
  const coverMap = getStyleCoverMap()

  assert.equal(Object.keys(coverMap).length, STYLE_NAMES.length)
  for (const style of STYLE_NAMES) {
    assert.ok(coverMap[style], `missing cover for ${style}`)
  }
  assert.equal(coverMap['北方文艺复兴'], DEFAULT_STYLE_COVER_URL)
})
