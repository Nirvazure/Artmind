import { readArtworks, writeArtworks } from '../../utils/artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }
  const artworks = await readArtworks()
  const index = artworks.findIndex((a) => a.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }
  artworks.splice(index, 1)
  await writeArtworks(artworks)
  return { deleted: true }
})
