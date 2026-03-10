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
  try {
    if (process.env.NODE_ENV === 'development') {
      console.warn('[classify] API 被调用')
    }
    const contentType = getHeader(event, 'content-type') ?? ''
    let imageUrl: string
    let model: string | undefined
    let imageBuffer: Buffer | undefined

    if (contentType.includes('application/json')) {
      const body = await readBody<{ imageUrl: string; model?: string }>(event)
      if (!body?.imageUrl) {
        throw createError({ statusCode: 400, message: 'No imageUrl provided' })
      }
      imageUrl = body.imageUrl
      model = body.model
      // Vercel serverless 无法读取本地文件，将相对路径转为绝对 URL 通过 HTTP 拉取
      if (imageUrl.startsWith('/') && !imageUrl.startsWith('//')) {
        const reqUrl = getRequestURL(event)
        imageUrl = `${reqUrl.origin}${imageUrl}`
      }
    } else {
      const formData = await readMultipartFormData(event)
      const image = formData?.find((f) => f.name === 'image')
      const modelField = formData?.find((f) => f.name === 'model')
      if (!image?.data) {
        throw createError({ statusCode: 400, message: 'No image provided' })
      }
      imageBuffer = Buffer.isBuffer(image.data) ? image.data : Buffer.from(image.data)
      try {
        const ext = image.filename?.split('.').pop() ?? 'jpg'
        const filename = `${randomUUID()}.${ext}`
        imageUrl = await saveFile(image.data, filename)
      } catch (e) {
        throw createError({
          statusCode: 503,
          message: '当前部署环境不支持本地上传，请使用「换一张」选择远程图片后分析',
        })
      }
      model = modelField?.data?.toString()
    }

  // multipart：用已有 buffer 直接推理，避免对 OSS URL 发起 HTTP 请求（私有桶会 403）
  const result = await classify(imageBuffer ?? imageUrl, model)
  const painters = getTopPaintersByStyle(result.topStyle, 3)
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
  } catch (e) {
    const err = e as Error & { statusCode?: number }
    if (err?.statusCode && err.statusCode >= 400) {
      throw e
    }
    console.error('[classify]', err)
    throw createError({
      statusCode: 503,
      message: '分类服务异常，请查看服务端日志或检查 PAINTING_INFERENCE_URL 配置',
    })
  }
})
