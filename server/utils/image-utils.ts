import { readFile } from 'node:fs/promises'
import path from 'node:path'

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
