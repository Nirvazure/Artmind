import { saveFile } from '../utils/storage'
import { classify } from '../utils/classifier'
import { getTopPaintersByStyle } from '../utils/painter-mapping'
import { randomUUID } from 'node:crypto'

export interface ClassifyResult {
  styles: { name: string; confidence: number }[]
  painters: string[]
  imageUrl: string
  /** 开发时可检查：painting=keremberke */
  source?: 'painting'
  /** 模型原始输出 */
  rawLabels?: Array<{ label: string; score: number }>
}

export default defineEventHandler(async (event): Promise<ClassifyResult> => {
  if (process.env.NODE_ENV === 'development') {
    console.warn('[classify] API 被调用')
  }
  const contentType = getHeader(event, 'content-type') ?? ''
  let imageUrl: string
  let model: string | undefined

  if (contentType.includes('application/json')) {
    const body = await readBody<{ imageUrl: string; model?: string }>(event)
    if (!body?.imageUrl) {
      throw createError({ statusCode: 400, message: 'No imageUrl provided' })
    }
    imageUrl = body.imageUrl
    model = body.model
  } else {
    const formData = await readMultipartFormData(event)
    const image = formData?.find((f) => f.name === 'image')
    const modelField = formData?.find((f) => f.name === 'model')
    if (!image?.data) {
      throw createError({ statusCode: 400, message: 'No image provided' })
    }
    const ext = image.filename?.split('.').pop() ?? 'jpg'
    const filename = `${randomUUID()}.${ext}`
    imageUrl = await saveFile(image.data, filename)
    model = modelField?.data?.toString()
  }

  const result = await classify(imageUrl, model)
  const painters = await getTopPaintersByStyle(result.topStyle, 3)
  if (process.env.NODE_ENV === 'development') {
    console.warn('[classify] 完成, source:', result.source, 'imageUrl:', imageUrl.slice(0, 50))
  }
  return {
    styles: result.styles,
    painters,
    imageUrl,
    source: result.source,
    rawLabels: result.rawLabels,
  }
})
