import { readFile } from 'node:fs/promises'
import path from 'node:path'

const HF_API_BASE = 'https://router.huggingface.co/hf-inference/models'
/** 首次请求可能触发模型加载，需 60s+ */
const TIMEOUT_MS = 90000

/** 从 imageUrl 获取图片 Buffer：支持本地路径或远程 URL */
export async function getImageBuffer(imageUrl: string): Promise<Buffer> {
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    const res = await $fetch<ArrayBuffer>(imageUrl, {
      responseType: 'arrayBuffer',
      timeout: 15000,
    })
    return Buffer.from(res)
  }
  const localPath = path.join(process.cwd(), 'public', imageUrl.replace(/^\//, ''))
  return readFile(localPath)
}

/**
 * 调用 Hugging Face Inference API 进行图像分类
 * 支持：1. raw binary 2. base64 JSON；处理 "Model is loading" 重试
 * @returns 成功时返回 [{ label, score }]，失败返回 null
 */
export async function callHFInference(
  imageBuffer: Buffer,
  token: string,
  modelId: string
): Promise<Array<{ label: string; score: number }> | null> {
  const url = `${HF_API_BASE}/${modelId}`

  async function doRequest(useBase64 = false): Promise<unknown> {
    if (useBase64) {
      const base64 = imageBuffer.toString('base64')
      return $fetch(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: base64 }),
        timeout: TIMEOUT_MS,
      })
    }
    return $fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'image/jpeg',
      },
      body: imageBuffer,
      timeout: TIMEOUT_MS,
    })
  }

  try {
    let res = await doRequest(false)

    if (res && typeof res === 'object' && 'error' in res) {
      const err = res as { error?: string; estimated_time?: number }
      if (err.error?.includes('loading') && typeof err.estimated_time === 'number') {
        await new Promise((r) => setTimeout(r, (err.estimated_time + 2) * 1000))
        res = await doRequest(false)
      }
    }

    if (res && typeof res === 'object' && 'error' in res) {
      res = await doRequest(true)
    }

    if (res && typeof res === 'object' && 'error' in res) {
      console.warn('[HF] API error:', (res as { error: string }).error)
      return null
    }

    if (Array.isArray(res) && res.length > 0) {
      return res as Array<{ label: string; score: number }>
    }
    /** 兼容单对象格式 { label, score } */
    if (res && typeof res === 'object' && 'label' in res && typeof (res as { score?: number }).score === 'number') {
      return [res as { label: string; score: number }]
    }
    console.warn('[HF] Unexpected response:', JSON.stringify(res).slice(0, 300))
    return null
  } catch (e) {
    console.warn('[HF] Request failed:', (e as Error).message)
    return null
  }
}
