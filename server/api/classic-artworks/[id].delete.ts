import { readClassicArtworks, writeClassicArtworks } from '../../utils/classic-artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }
  const items = await readClassicArtworks()
  const index = items.findIndex((a) => a.id === id)
  if (index === -1) {
    throw createError({ statusCode: 404, message: 'Classic artwork not found' })
  }
  items.splice(index, 1)
  await writeClassicArtworks(items)
  return { deleted: true }
})
