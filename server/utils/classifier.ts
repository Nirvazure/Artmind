import { getImageBuffer } from './image-utils'
import { callPaintingInference } from './painting-client'
import { KEREMBERKE_TO_STYLE } from './styles-data'

export interface StylePrediction {
  name: string
  confidence: number
}

const FALLBACK_STYLE = '印象派'

function mapKeremberkeLabelToStyle(label: string): string {
  return KEREMBERKE_TO_STYLE[label] ?? KEREMBERKE_TO_STYLE[label.replace(/\s+/g, '_')] ?? FALLBACK_STYLE
}

/**
 * AI 分类抽象层
 * 仅使用 keremberke（Painting 服务）进行艺术流派分类
 * @param imageUrl 图片 URL 或本地路径（如 /uploads/xxx.jpg）
 * @param _model 模型名称（保留，与 engine 关联）
 */
export async function classify(
  imageUrl: string,
  _model?: string
): Promise<{ styles: StylePrediction[]; topStyle: string; source: 'painting'; rawLabels?: Array<{ label: string; score: number }> }> {
  const config = useRuntimeConfig()
  const paintingUrl = (
    (config.paintingInferenceUrl as string)?.trim() ||
    (process.env.PAINTING_INFERENCE_URL || process.env.NUXT_PAINTING_INFERENCE_URL || '').trim()
  )

  if (!paintingUrl) {
    throw createError({
      statusCode: 503,
      message: '未配置 PAINTING_INFERENCE_URL。请部署 HF Space 后设置',
    })
  }

  if (process.env.NODE_ENV === 'development') {
    console.warn('[classifier] Calling Painting service:', paintingUrl)
  }

  const buffer = await getImageBuffer(imageUrl)
  const result = await callPaintingInference(buffer, paintingUrl)

  if (!result || result.length === 0) {
    throw createError({ statusCode: 503, message: '艺术流派推理服务返回空结果' })
  }

  const styles: StylePrediction[] = result.slice(0, 5).map((item) => ({
    name: mapKeremberkeLabelToStyle(item.label),
    confidence: item.score,
  }))
  const topStyle = styles[0]?.name ?? FALLBACK_STYLE
  return { styles, topStyle, source: 'painting', rawLabels: result }
}
