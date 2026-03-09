/**
 * AI 分类抽象层（前端调用）
 * 支持：1. 按 URL 分析（随机图） 2. 按文件上传分析
 */
export interface StylePrediction {
  name: string
  confidence: number
}

export interface ClassifyResult {
  styles: StylePrediction[]
  painters: string[]
  imageUrl: string
  topStyle?: string
  source?: 'painting'
  /** 模型原始输出 */
  rawLabels?: Array<{ label: string; score: number }>
}

export function useClassifier() {
  const classifyByUrl = async (imageUrl: string): Promise<ClassifyResult> => {
    const res = await $fetch<ClassifyResult>('/api/classify', {
      method: 'POST',
      body: { imageUrl },
      headers: { 'Content-Type': 'application/json' },
    })
    return res
  }

  const classifyByFile = async (file: File): Promise<ClassifyResult> => {
    const formData = new FormData()
    formData.append('image', file)
    const res = await $fetch<ClassifyResult>('/api/classify', {
      method: 'POST',
      body: formData,
    })
    return res
  }

  return { classifyByUrl, classifyByFile }
}
