import assert from 'node:assert/strict'
import test from 'node:test'
import { mapArtworkRow, type ArtworkRow } from '../composables/useArtworkMapper'

const row: ArtworkRow = {
  id: 'work',
  user_id: 'owner',
  title: '画作',
  style: '印象派',
  image_url: 'work.jpg',
  image_width: 400,
  image_height: 300,
  is_public: true,
  analysis_result: null,
  created_at: '2026-10-17T18:30:00Z',
}

test('artwork mapping retains uploader identity alongside upload time', () => {
  const mapped = mapArtworkRow({
    ...row,
    uploader: { display_name: '  Nirvazure  ', avatar_url: 'avatar.jpg' },
  })
  assert.deepEqual(mapped.uploader, { name: 'Nirvazure', photo: 'avatar.jpg' })
  assert.equal(mapped.createdAt, row.created_at)
})

test('missing or incomplete profiles support a neutral uploader fallback', () => {
  assert.equal(mapArtworkRow({ ...row, uploader: null }).uploader, undefined)
  assert.deepEqual(
    mapArtworkRow({ ...row, uploader: { display_name: null, avatar_url: null } }).uploader,
    { name: '上传者', photo: undefined },
  )
})
