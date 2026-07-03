import { insertArtwork } from '../../utils/artworks-data'
import type { Artwork } from '../../utils/artworks-data'
import { getUserIdFromToken } from '../../utils/auth'
import { getSupabaseAdmin } from '../../utils/supabase-admin'
import { getImageDimensions } from '../../utils/image-dimensions'
import { copyFromTempToArtworks } from '../../utils/storage'
import { insertStyleCorrection } from '../../utils/style-corrections'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const userId = await getUserIdFromToken(event)
  if (!userId) {
    throw createError({ statusCode: 401, message: '请先登录后再保存到画廊' })
  }

  const body = await readBody<{
    title: string
    style: string
    imageUrl: string
    isPublic?: boolean
    aiPainters?: string[]
    analysisResult?: import('../../utils/artworks-data').ArtworkAnalysisResult
  }>(event)
  if (!body?.title || !body?.style || !body?.imageUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing title, style, or imageUrl',
    })
  }
  const imageUrl = await copyFromTempToArtworks(body.imageUrl)
  const dims = await getImageDimensions(imageUrl)
  const newArtwork: Artwork = {
    id: randomUUID(),
    userId,
    title: body.title,
    style: body.style,
    imageUrl,
    isPublic: body.isPublic ?? false,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
    ...(dims && { imageWidth: dims.width, imageHeight: dims.height }),
    ...(body.analysisResult && { analysisResult: body.analysisResult }),
  }
  const created = await insertArtwork(newArtwork)

  if (body.analysisResult) {
    const aiTopStyle = body.analysisResult.styles[0]?.name ?? body.style
    const userPainters = body.analysisResult.painters ?? []
    const aiPainters = body.aiPainters ?? userPainters
    try {
      await insertStyleCorrection({
        userId,
        artworkId: created.id,
        imageUrl,
        aiTopStyle,
        aiStyles: body.analysisResult.styles,
        userStyle: body.style,
        aiPainters,
        userPainters,
        rawLabels: body.analysisResult.rawLabels,
      })
    } catch {
      // correction 失败不影响保存
    }
  }

  try {
    const supabase = getSupabaseAdmin()
    await supabase.from('uploads').update({ saved: true }).eq('temp_path', body.imageUrl)
  } catch {
    // uploads 标记失败不影响保存
  }

  if (created.isPublic) {
    // 公开作品加入 store 缓存需客户端 refresh；此处无操作
  }

  return created
})
