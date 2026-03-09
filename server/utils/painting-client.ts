/** HF Space 冷启动可能 2–3 分钟，设 3 分钟 */
const TIMEOUT_MS = 180000

/**
 * 优先使用 Space 自定义 /predict（FormData 直返 JSON），与 app_gradio 的 gr.api.post("/predict") 兼容
 */
async function callPredictFormData(
  imageBuffer: Buffer,
  baseUrl: string
): Promise<Array<{ label: string; score: number }> | null> {
  const root = baseUrl.replace(/\/$/, '')
  // FastAPI @app.post("/predict") 暴露在根路径
  const paths = [`${root}/predict`, `${root}/post/predict`, `${root}/gradio_api/post/predict`, `${root}/gradio_api/predict`]

  for (const url of paths) {
    const formData = new FormData()
    formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg')
    try {
      const res = await $fetch<Array<{ label: string; score: number }>>(url, {
        method: 'POST',
        body: formData,
        timeout: TIMEOUT_MS,
      })
      if (Array.isArray(res) && res.length > 0) return res
    } catch (e) {
      const err = e as Error & { statusCode?: number }
      if (err.statusCode === 404) continue
      console.warn('[Painting] FormData /predict failed:', url, err.message)
      return null
    }
  }
  return null
}

/**
 * 备用：先 /upload 再 call predict_ui（Gradio 原生 API）
 */
async function uploadThenPredict(
  imageBuffer: Buffer,
  baseUrl: string
): Promise<Array<{ label: string; score: number }> | null> {
  const root = baseUrl.replace(/\/$/, '')

  // 1. Multipart 上传到 Gradio /upload，避免 base64 过大触发 HF 413
  const uploadPaths = [`${root}/gradio_api/upload`, `${root}/upload`]
  let uploadRes: unknown = null
  for (const uploadPath of uploadPaths) {
    const formData = new FormData()
    formData.append('files', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg')
    try {
      uploadRes = await $fetch(uploadPath, {
        method: 'POST',
        body: formData,
        timeout: 60000,
      })
      break
    } catch (e) {
      const err = e as Error & { statusCode?: number }
      if (err.statusCode === 404) continue
      console.warn('[Painting] Gradio upload failed:', uploadPath, err.message)
      return null
    }
  }
  if (uploadRes == null) {
    console.warn('[Painting] Gradio upload 404 at all paths')
    return null
  }

  // 响应格式：["/file=/tmp/..."] 或 [{"path","url",...}]
  let filePath = ''
  let fileUrl = ''
  if (Array.isArray(uploadRes) && uploadRes.length > 0) {
    const first = uploadRes[0]
    if (typeof first === 'string') {
      filePath = first
      fileUrl = first.startsWith('http') ? first : `${root}${first}`
    } else if (first && typeof first === 'object' && ('path' in first || 'url' in first)) {
      const obj = first as { path?: string; url?: string }
      filePath = obj.path ?? ''
      fileUrl = obj.url ?? (filePath.startsWith('http') ? filePath : `${root}${filePath}`)
    }
  }
  if (!filePath && !fileUrl) {
    console.warn('[Painting] Gradio upload returned no path:', JSON.stringify(uploadRes).slice(0, 200))
    return null
  }
  if (!fileUrl.startsWith('http')) fileUrl = `${root}${filePath}`

  const imageInput = {
    path: filePath || null,
    url: fileUrl,
    orig_name: 'image.jpg',
    meta: { _type: 'gradio.FileData' as const },
  }

  const apiPath = `${root}/gradio_api/call/predict_ui`
  const postRes = await $fetch<{ event_id: string }>(apiPath, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ data: [imageInput] }),
    timeout: TIMEOUT_MS,
  })

  const eventId = postRes?.event_id
  if (!eventId) {
    console.warn('[Painting] Gradio API no event_id:', JSON.stringify(postRes).slice(0, 200))
    return null
  }

  const getUrl = `${root}/gradio_api/call/predict_ui/${eventId}`
  const getRes = await $fetch<string>(getUrl, {
    responseType: 'text',
    timeout: TIMEOUT_MS,
  })

  const raw = String(getRes ?? '')
  if (!raw) {
    console.warn('[Painting] Gradio GET empty response')
    return null
  }

  const lines = raw.split('\n')
  for (let i = 0; i < lines.length; i++) {
    const eventLine = lines[i]
    if (!eventLine?.startsWith('event: ')) continue
    const eventType = eventLine.slice(7).trim()
    if (eventType === 'error') {
      const dataLine = lines[i + 1]
      const errMsg = dataLine?.startsWith('data: ') ? dataLine.slice(6).trim() : ''
      console.warn('[Painting] Gradio SSE error event:', errMsg.slice(0, 300))
      return null
    }
    if (eventType === 'complete' || eventType === 'completed') {
      const dataLine = lines[i + 1]
      if (!dataLine?.startsWith('data: ')) {
        console.warn('[Painting] Gradio complete without data line, raw snippet:', raw.slice(0, 400))
        return null
      }
      const json = dataLine.slice(6).trim()
      if (!json || json === 'null') {
        console.warn('[Painting] Gradio data empty, raw snippet:', raw.slice(0, 400))
        return null
      }
      try {
        const parsed = JSON.parse(json) as unknown
        const arr = Array.isArray(parsed) ? parsed[0] : parsed
        if (Array.isArray(arr) && arr.length > 0) {
          return arr as Array<{ label: string; score: number }>
        }
        console.warn('[Painting] Gradio parsed not array/empty:', typeof arr, Array.isArray(arr) ? arr.length : 'n/a', 'snippet:', json.slice(0, 150))
      } catch (e) {
        console.warn('[Painting] Gradio parse data failed:', (e as Error).message, json.slice(0, 200))
      }
      return null
    }
  }
  console.warn('[Painting] Gradio no complete event in response, first 600 chars:', raw.slice(0, 600))
  return null
}

/**
 * 调用艺术流派推理服务（本地 Python、HF Space Docker、或 Gradio）
 * @param imageBuffer 图片 Buffer
 * @param baseUrl PAINTING_INFERENCE_URL
 * @returns 成功时返回 [{ label, score }]，空/非法响应返回 null，请求失败时 throw
 */
export async function callPaintingInference(
  imageBuffer: Buffer,
  baseUrl: string
): Promise<Array<{ label: string; score: number }> | null> {
  const config = useRuntimeConfig()
  const useGradio = (config.paintingUseGradioApi as boolean) === true

  try {
    let res: Array<{ label: string; score: number }> | null

    if (useGradio) {
      res = await callPredictFormData(imageBuffer, baseUrl)
      if (!res) res = await uploadThenPredict(imageBuffer, baseUrl)
    } else {
      const path = (config.paintingPredictPath as string)?.replace(/^\//, '') || 'predict'
      const url = `${baseUrl.replace(/\/$/, '')}/${path}`
      const formData = new FormData()
      formData.append('image', new Blob([imageBuffer], { type: 'image/jpeg' }), 'image.jpg')
      res = await $fetch<Array<{ label: string; score: number }>>(url, {
        method: 'POST',
        body: formData,
        timeout: TIMEOUT_MS,
      })
    }

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
