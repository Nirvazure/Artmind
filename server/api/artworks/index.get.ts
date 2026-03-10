import { getArtworks } from '../../utils/artworks-data'

export default defineEventHandler(async () => {
  return getArtworks()
})
