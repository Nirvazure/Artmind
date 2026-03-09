import { readArtworks } from '../../utils/artworks-data'

export default defineEventHandler(async () => {
  return readArtworks()
})
