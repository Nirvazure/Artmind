import assert from 'node:assert/strict'
import test from 'node:test'

import {
  buildArtworkActionPermissions,
  canSubmitArtworkAction,
  resolveArtworkAction,
  resolveDefaultSelectedStyle,
} from '../utils/artwork-action-permissions'

test('unauthenticated users cannot save or update analysis results', () => {
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

test('authenticated users can save analysis results for artworks they do not own', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: false,
    isSavedArtwork: false,
  })

  assert.equal(permissions.showSaveToGallery, true)
  assert.equal(permissions.showUpdateArtwork, false)
  assert.equal(permissions.canOpenArtworkActionDialog, true)
})

test('authenticated users cannot save persisted artworks they do not own', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: false,
    isSavedArtwork: true,
  })

  assert.deepEqual(permissions, {
    showSaveToGallery: false,
    showUpdateArtwork: false,
    canOpenArtworkActionDialog: false,
  })
})

test('authenticated users can update analysis results for artworks they own', () => {
  const permissions = buildArtworkActionPermissions({
    authLoading: false,
    isAuthenticated: true,
    hasResult: true,
    isExistingOwned: true,
    isSavedArtwork: true,
  })

  assert.equal(permissions.showSaveToGallery, false)
  assert.equal(permissions.showUpdateArtwork, true)
  assert.equal(permissions.canOpenArtworkActionDialog, true)
})

test('auth loading hides both save and update entry points', () => {
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

test('action resolution and submit guard only allow the current mode', () => {
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

test('save action prefers AI top style over saved artwork style', () => {
  assert.equal(
    resolveDefaultSelectedStyle({
      action: 'save',
      artworkStyle: '波普艺术',
      aiTopStyle: '野兽派',
    }),
    '野兽派',
  )
})

test('update action prefers saved artwork style over AI top style', () => {
  assert.equal(
    resolveDefaultSelectedStyle({
      action: 'update',
      artworkStyle: '波普艺术',
      aiTopStyle: '野兽派',
    }),
    '波普艺术',
  )
})

test('update action falls back to AI top style when artwork style is empty', () => {
  assert.equal(
    resolveDefaultSelectedStyle({
      action: 'update',
      artworkStyle: '   ',
      aiTopStyle: '野兽派',
    }),
    '野兽派',
  )
})

test('null action still prefers AI top style first', () => {
  assert.equal(
    resolveDefaultSelectedStyle({
      action: null,
      artworkStyle: '波普艺术',
      aiTopStyle: '野兽派',
    }),
    '野兽派',
  )
})

test('default style resolution trims whitespace before comparison', () => {
  assert.equal(
    resolveDefaultSelectedStyle({
      action: 'update',
      artworkStyle: '  波普艺术  ',
      aiTopStyle: '  野兽派  ',
    }),
    '波普艺术',
  )
  assert.equal(
    resolveDefaultSelectedStyle({
      action: 'save',
      artworkStyle: '  波普艺术  ',
      aiTopStyle: '  野兽派  ',
    }),
    '野兽派',
  )
})
