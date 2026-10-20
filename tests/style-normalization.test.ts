import assert from 'node:assert/strict'
import test from 'node:test'

import { DEFAULT_STYLE_COVER_URL, getStyleCoverMap } from '../server/utils/styles-data'
import { STYLE_NAMES } from '../utils/style-labels'

test('流派封面接口为每个 HF 流派提供封面', () => {
  const coverMap = getStyleCoverMap()

  assert.equal(Object.keys(coverMap).length, STYLE_NAMES.length)
  for (const style of STYLE_NAMES) {
    assert.ok(coverMap[style], `missing cover for ${style}`)
  }
  assert.equal(coverMap['北方文艺复兴'], DEFAULT_STYLE_COVER_URL)
})
