import assert from 'node:assert/strict'
import test from 'node:test'
import { galleryArtworkName, normalizeGalleryLoopOffset } from '../utils/gallery-display'

test('Gallery hides empty and unnamed placeholders but retains real artwork names', () => {
  for (const name of ['', '  ', '未命名', '未命名作品', ' 未命名画作 ']) {
    assert.equal(galleryArtworkName(name), '')
  }
  assert.equal(galleryArtworkName('  流浪者 Wanderer  '), '流浪者 Wanderer')
  assert.equal(galleryArtworkName('未命名的星夜'), '未命名的星夜')
})

test('the Gallery ring wraps forward and backward without losing position', () => {
  assert.equal(normalizeGalleryLoopOffset(100, 100), 100)
  assert.equal(normalizeGalleryLoopOffset(199, 100), 199)
  assert.equal(normalizeGalleryLoopOffset(200, 100), 100)
  assert.equal(normalizeGalleryLoopOffset(99, 100), 199)
  assert.equal(normalizeGalleryLoopOffset(-205, 100), 195)
  assert.equal(normalizeGalleryLoopOffset(1107, 100), 107)
  assert.equal(normalizeGalleryLoopOffset(200.5, 100), 100.5)
})

test('the Gallery ring handles loading before its dimensions are available', () => {
  assert.equal(normalizeGalleryLoopOffset(200, 0), 0)
  assert.equal(normalizeGalleryLoopOffset(NaN, 100), 0)
})
