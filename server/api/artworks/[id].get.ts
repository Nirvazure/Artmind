import { getArtworkById } from '../../utils/artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, statusMessage: 'Missing artwork id' })
  }
  const artwork = await getArtworkById(id)
  if (!artwork) {
    throw createError({ statusCode: 404, statusMessage: 'Artwork not found' })
  }
  return artwork
})
