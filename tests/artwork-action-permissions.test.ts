import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildArtworkActionPermissions,
  canSubmitArtworkAction,
  resolveArtworkAction,
} from '../utils/artwork-action-permissions'

test('未登录普通分析结果不显示保存也不显示更新', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: false,
    hasResult: true,
    isExistingOwned: false,
  })

  assert.deepEqual(permissions, {
    showSaveToGallery: false,
    showUpdateArtwork: false,
    canOpenArtworkActionDialog: false,
  })
})

test('已登录非本人分析结果显示保存不显示更新', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: false,
  })

  assert.equal(permissions.showSaveToGallery, true)
  assert.equal(permissions.showUpdateArtwork, false)
  assert.equal(permissions.canOpenArtworkActionDialog, true)
})

test('已登录本人已保存作品只显示更新', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: true,
  })

  assert.equal(permissions.showSaveToGallery, false)
  assert.equal(permissions.showUpdateArtwork, true)
  assert.equal(permissions.canOpenArtworkActionDialog, true)
})

test('鉴权加载中两个入口都隐藏', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: true,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: true,
  })

  assert.deepEqual(permissions, {
    showSaveToGallery: false,
    showUpdateArtwork: false,
    canOpenArtworkActionDialog: false,
  })
})

test('动作解析与提交守卫只放行当前可用操作', () => {
  const saveOnly = {
    showSaveToGallery: true,
    showUpdateArtwork: false,
    canOpenArtworkActionDialog: true,
  }
  const updateOnly = {
    showSaveToGallery: false,
    showUpdateArtwork: true,
    canOpenArtworkActionDialog: true,
  }
  const none = {
    showSaveToGallery: false,
    showUpdateArtwork: false,
    canOpenArtworkActionDialog: false,
  }

  assert.equal(resolveArtworkAction(saveOnly), 'save')
  assert.equal(resolveArtworkAction(updateOnly), 'update')
  assert.equal(resolveArtworkAction(none), null)

  assert.equal(canSubmitArtworkAction('save', saveOnly), true)
  assert.equal(canSubmitArtworkAction('update', saveOnly), false)
  assert.equal(canSubmitArtworkAction('update', updateOnly), true)
  assert.equal(canSubmitArtworkAction('save', updateOnly), false)
  assert.equal(canSubmitArtworkAction('save', none), false)
})
