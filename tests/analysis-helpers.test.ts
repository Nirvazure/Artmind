import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getPageItems,
  normalizeArtworkTitle,
  resolveAnalysisViewPhase,
  shouldSendBackgroundNotification,
} from '../utils/analysis-helpers'
import { useAnalysisSession } from '../composables/useAnalysisSession'
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

test('分析记录分页按页码切片', () => {
  const items = Array.from({ length: 23 }, (_, index) => index + 1)
  assert.deepEqual(getPageItems(items, 1, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
  assert.deepEqual(getPageItems(items, 3, 10), [21, 22, 23])
  assert.deepEqual(getPageItems(items, 0, 10), [1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
})

test('重新上传待分析图片时不显示分析中状态', () => {
  assert.equal(
    resolveAnalysisViewPhase({
      analysisPhase: 'idle',
      hasActiveResult: false,
    }),
    'idle',
  )
  assert.equal(
    resolveAnalysisViewPhase({
      analysisPhase: 'running',
      hasActiveResult: false,
    }),
    'analyzing',
  )
  assert.equal(
    resolveAnalysisViewPhase({
      analysisPhase: 'idle',
      hasActiveResult: true,
    }),
    'resolved',
  )
  assert.equal(
    resolveAnalysisViewPhase({
      analysisPhase: 'error',
      hasActiveResult: false,
    }),
    'idle',
  )
})

test('分析 session 保存成功后保留当前展示结果并切换到作品 subject', () => {
  const session = useAnalysisSession()
  const result = {
    styles: [{ name: '后印象派', confidence: 0.91 }],
    painters: ['梵高'],
    imageUrl: 'temp.jpg',
  }
  const savedArtwork = {
    id: 'saved-1',
    userId: 'user-1',
    title: '',
    style: '后印象派',
    imageUrl: 'artwork.jpg',
    isPublic: false,
    likes: [],
    comments: [],
    createdAt: '2026-07-20T00:00:00.000Z',
    analysisResult: {
      styles: result.styles,
      painters: result.painters,
    },
  }

  session.activeResult.value = result
  session.commitSavedArtwork(savedArtwork)

  assert.equal(session.subject.value?.type, 'artwork')
  assert.equal(session.activeResult.value?.styles[0]?.name, '后印象派')
  assert.equal(session.activeResult.value?.imageUrl, 'artwork.jpg')
  assert.equal(session.analysisPhase.value, 'idle')
})

test('分析 session 同作品路由同步不会清空当前展示结果', () => {
  const session = useAnalysisSession()
  const artwork = {
    id: 'artwork-1',
    userId: 'user-1',
    title: '',
    style: '后印象派',
    imageUrl: 'artwork.jpg',
    isPublic: false,
    likes: [],
    comments: [],
    createdAt: '2026-07-20T00:00:00.000Z',
    analysisResult: {
      styles: [{ name: '后印象派', confidence: 0.91 }],
      painters: ['梵高'],
    },
  }

  session.commitSavedArtwork(artwork)
  const currentResult = session.activeResult.value
  session.syncRouteArtwork({ ...artwork, title: 'updated title' })

  assert.equal(session.activeResult.value, currentResult)
  assert.equal(session.subject.value?.type, 'artwork')
})

test('分析 session 重新上传会失效旧请求并隐藏结果', () => {
  const session = useAnalysisSession()
  const requestId = session.beginAnalysis()
  const file = new File(['x'], 'new.jpg', { type: 'image/jpeg' })

  session.setLocalFile(file, 'blob:new')

  assert.equal(session.analysisPhase.value, 'idle')
  assert.equal(session.activeResult.value, null)
  assert.equal(session.subject.value?.type, 'local-file')
  assert.equal(
    session.resolveAnalysis(requestId, {
      styles: [{ name: '旧结果', confidence: 0.8 }],
      painters: [],
    }),
    false,
  )
  assert.equal(session.activeResult.value, null)
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
