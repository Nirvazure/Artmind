import { getUserIdFromToken } from '../../utils/auth'
import { getArtworkById, updateArtwork } from '../../utils/artworks-data'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }
  const body = await readBody<{
    likes?: string[]
    analysisResult?: import('../../utils/artworks-data').ArtworkAnalysisResult
  }>(event).catch(() => ({}))

  let likesToSet: string[] | undefined

  if (body?.likes !== undefined) {
    const userId = await getUserIdFromToken(event)
    if (!userId) {
      throw createError({ statusCode: 401, message: '请先登录' })
    }
    const current = await getArtworkById(id)
    if (!current) {
      throw createError({ statusCode: 404, message: 'Artwork not found' })
    }
    const oldLikes = current.likes
    const newLikes = body.likes
    const added = newLikes.filter((x) => !oldLikes.includes(x))
    const removed = oldLikes.filter((x) => !newLikes.includes(x))
    const validAdd = added.length === 1 && added[0] === userId && removed.length === 0
    const validRemove = removed.length === 1 && removed[0] === userId && added.length === 0
    if (validAdd || validRemove) {
      likesToSet = newLikes
    }
  }

  const updated = await updateArtwork(id, {
    likes: likesToSet,
    analysisResult: body?.analysisResult,
  })
  if (!updated) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }
  return updated
})
