import { updateArtwork } from '../../../utils/artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }
  const body = await readBody<{
    analysisResult?: import('../../../utils/artworks-data').ArtworkAnalysisResult
  }>(event)
  if (!body?.analysisResult) {
    throw createError({ statusCode: 400, message: 'Missing analysisResult' })
  }
  const updated = await updateArtwork(id, { analysisResult: body.analysisResult })
  if (!updated) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }
  return updated
})
