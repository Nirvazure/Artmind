import { getArtworkById, updateArtwork } from '../../utils/artworks-data'
import { getUserIdFromToken } from '../../utils/auth'
import { insertStyleCorrection } from '../../utils/style-corrections'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromToken(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: '请先登录' })
  }

  const id = getRouterParam(event, 'id')
  if (!id) {
    throw createError({ statusCode: 400, message: 'Missing id' })
  }

  const existing = await getArtworkById(id)
  if (!existing) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }
  if (existing.userId !== userId) {
    throw createError({ statusCode: 403, message: '无权修改此作品' })
  }

  const body = await readBody<{
    title?: string
    style?: string
    isPublic?: boolean
    aiPainters?: string[]
    analysisResult?: import('../../utils/artworks-data').ArtworkAnalysisResult
  }>(event)

  const updated = await updateArtwork(id, {
    ...(body.title !== undefined && { title: body.title }),
    ...(body.style !== undefined && { style: body.style }),
    ...(body.isPublic !== undefined && { isPublic: body.isPublic }),
    ...(body.analysisResult !== undefined && { analysisResult: body.analysisResult }),
  })

  if (!updated) {
    throw createError({ statusCode: 404, message: 'Artwork not found' })
  }

  if (body.analysisResult) {
    const aiTopStyle = body.analysisResult.styles[0]?.name ?? updated.style
    const userPainters = body.analysisResult.painters ?? []
    const aiPainters = body.aiPainters ?? userPainters
    try {
      await insertStyleCorrection({
        userId,
        artworkId: id,
        imageUrl: updated.imageUrl,
        aiTopStyle,
        aiStyles: body.analysisResult.styles,
        userStyle: body.style ?? updated.style,
        aiPainters,
        userPainters,
        rawLabels: body.analysisResult.rawLabels,
      })
    } catch {
      // correction 失败不影响更新
    }
  }

  return updated
})
