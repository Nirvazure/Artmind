/** HF Space 冷启动可能 2–3 分钟，设 3 分钟 */
const TIMEOUT_MS = 180000

/**
 * 调用艺术流派推理服务（HF Space /predict 等）
 * @param imageBuffer 图片 Buffer
 * @param baseUrl PAINTING_INFERENCE_URL
 * @returns 成功时返回 [{ label, score }]，空/非法响应返回 null，请求失败时 throw
 */
export async function callPaintingInference(
  imageBuffer: Buffer,
  baseUrl: string
): Promise<Array<{ label: string; score: number }> | null> {
  const config = useRuntimeConfig()
  const path = (config.paintingPredictPath as string)?.replace(/^\//, '') || 'predict'
  const url = `${baseUrl.replace(/\/$/, '')}/${path}`

  try {
    const formData = new FormData()
    formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg')
    const res = await $fetch<Array<{ label: string; score: number }>>(url, {
      method: 'POST',
      body: formData,
      timeout: TIMEOUT_MS,
    })

    if (!Array.isArray(res) || res.length === 0) {
      console.warn('[Painting] Unexpected response:', JSON.stringify(res).slice(0, 200))
      return null
    }
    return res
  } catch (e) {
    const err = e as Error & { statusCode?: number; data?: unknown }
    const statusCode = err.statusCode ?? (err as { response?: { status?: number } }).response?.status
    const detail = err.data ?? (err as { response?: { _data?: unknown } }).response?._data
    const snippet =
      typeof detail === 'string'
        ? detail.slice(0, 300)
        : detail
          ? JSON.stringify(detail).slice(0, 300)
          : ''
    console.warn(
      '[Painting] Request failed:',
      err.message,
      statusCode ? `status=${statusCode}` : '',
      snippet ? `body=${snippet}` : ''
    )
    throw createError({
      statusCode: 503,
      message: `艺术流派推理服务请求失败: ${err.message}`,
    })
  }
}
