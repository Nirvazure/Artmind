import assert from 'node:assert/strict'
import test from 'node:test'
import type { Artwork } from '../stores/artwork'
import {
  filterGalleryArtworks,
  resolveGalleryFilters,
  selectGalleryArtworks,
} from '../utils/gallery-filters'

function artwork(id: string, overrides: Partial<Artwork> = {}): Artwork {
  return {
    id,
    userId: 'other',
    title: id,
    style: '印象派',
    imageUrl: `${id}.jpg`,
    isPublic: true,
    likes: [],
    comments: [],
    createdAt: '2026-10-17',
    ...overrides,
  }
}

const publicArtwork = artwork('public')
const privateArtwork = artwork('private', { userId: 'me', isPublic: false })
const uncollectedArtwork = artwork('uncollected')
const myUncollectedArtwork = artwork('my-uncollected', { userId: 'me' })
const sources = {
  publicArtworks: [publicArtwork, privateArtwork, uncollectedArtwork, myUncollectedArtwork],
  myArtworks: [privateArtwork, publicArtwork, myUncollectedArtwork],
  collectedArtworks: [publicArtwork, privateArtwork],
  userId: 'me',
}

test('Gallery URL resolves scope and collection independently with safe defaults', () => {
  assert.deepEqual(resolveGalleryFilters({ scope: 'personal', collected: 'true' }), {
    scope: 'personal',
    onlyCollected: true,
  })
  assert.deepEqual(resolveGalleryFilters({ collected: 'true' }), {
    scope: 'community',
    onlyCollected: true,
  })
  assert.deepEqual(resolveGalleryFilters({ scope: ['personal'], collected: 'invalid' }), {
    scope: 'community',
    onlyCollected: false,
  })
  assert.deepEqual(resolveGalleryFilters({}), { scope: 'community', onlyCollected: false })
})

test('existing Gallery links still resolve to the corresponding filters', () => {
  assert.deepEqual(resolveGalleryFilters({ view: 'mine' }), {
    scope: 'personal',
    onlyCollected: false,
  })
  assert.deepEqual(resolveGalleryFilters({ view: 'collection' }), {
    scope: 'community',
    onlyCollected: true,
  })
  assert.deepEqual(
    resolveGalleryFilters({ scope: 'community', collected: 'false', view: 'mine' }),
    { scope: 'community', onlyCollected: false },
  )
})

test('community excludes private works while mine includes only the current user’s works', () => {
  assert.deepEqual(selectGalleryArtworks('community', sources), [
    publicArtwork,
    uncollectedArtwork,
    myUncollectedArtwork,
  ])
  assert.deepEqual(selectGalleryArtworks('personal', sources), [
    privateArtwork,
    myUncollectedArtwork,
  ])
})

test('collection intersects the selected scope and never exposes private works in community', () => {
  assert.deepEqual(selectGalleryArtworks('community', sources, true), [publicArtwork])
  assert.deepEqual(selectGalleryArtworks('personal', sources, true), [privateArtwork])
  assert.deepEqual(
    selectGalleryArtworks('personal', { ...sources, collectedArtworks: [] }, true),
    [],
  )
})

test('personal views never return stale personal data after logout', () => {
  assert.deepEqual(selectGalleryArtworks('personal', { ...sources, userId: undefined }), [])
  assert.deepEqual(selectGalleryArtworks('community', { ...sources, userId: undefined }, true), [])
  assert.deepEqual(selectGalleryArtworks('personal', { ...sources, userId: undefined }, true), [])
})

test('style filters apply equally to private and public Gallery views', () => {
  const list = [
    privateArtwork,
    artwork('analyzed', {
      style: '后印象派',
    }),
    artwork('unrelated', { style: '立体主义' }),
  ]
  assert.deepEqual(filterGalleryArtworks(list, null), list)
  assert.deepEqual(filterGalleryArtworks(list, '印象派'), [privateArtwork])
  assert.deepEqual(filterGalleryArtworks(list, '后印象派'), [list[1]])
  assert.deepEqual(filterGalleryArtworks(list, '不存在'), [])
})
