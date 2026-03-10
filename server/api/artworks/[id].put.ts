import { updateArtwork } from '../../utils/artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }
  const body = await readBody<{
    likes?: string[]
    analysisResult?: import('../../utils/artworks-data').ArtworkAnalysisResult
  }>(event).catch(() => ({}))
  const updated = await updateArtwork(id, {
    likes: body?.likes,
    analysisResult: body?.analysisResult,
  })
  if (!updated) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }
  return updated
})
