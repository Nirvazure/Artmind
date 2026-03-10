import OSS from 'ali-oss'
import { compressImageToUnder1MB } from './image-compress'

type Prefix = 'temp' | 'artworks'

function getClient() {
  const config = useRuntimeConfig()
  const { ossRegion, ossBucket, ossAccessKeyId, ossAccessKeySecret } = config
  if (!ossRegion || !ossBucket || !ossAccessKeyId || !ossAccessKeySecret) {
    throw createError({
      statusCode: 503,
      message: 'OSS not configured',
    })
  }
  return new OSS({
    region: ossRegion,
    bucket: ossBucket,
    accessKeyId: ossAccessKeyId,
    accessKeySecret: ossAccessKeySecret,
  })
}

function getBaseUrl(): string {
  const config = useRuntimeConfig()
  const { ossBucket, ossRegion } = config
  return `https://${ossBucket}.${ossRegion}.aliyuncs.com`
}

/**
 * 保存文件到 OSS
 * @param prefix temp=分析临时（未保存到画廊），artworks=持久化（保存到画廊或直接上传）
 */
export async function saveFile(
  buffer: Buffer,
  filename: string,
  prefix: Prefix = 'temp'
): Promise<string> {
  const bufferToSave = await compressImageToUnder1MB(buffer, filename)
  const client = getClient()
  const objectName = `${prefix}/${filename}`
  await client.put(objectName, bufferToSave)
  return `${getBaseUrl()}/${objectName}`
}

/**
 * 将 temp 中的对象复制到 artworks，用于「保存到画廊」时持久化
 * @param tempUrl temp 对象的完整 URL，如 https://bucket.region.aliyuncs.com/temp/xxx.jpg
 * @returns artworks 的新 URL，若不是本桶 temp URL 则返回原 URL
 */
export async function copyFromTempToArtworks(tempUrl: string): Promise<string> {
  const config = useRuntimeConfig()
  const baseUrl = getBaseUrl()
  if (!tempUrl.startsWith(baseUrl + '/temp/')) {
    return tempUrl
  }
  const path = tempUrl.slice(baseUrl.length).replace(/^\//, '')
  if (!path.startsWith('temp/')) {
    return tempUrl
  }
  const filename = path.slice(5)
  const client = getClient()
  await client.copy(`artworks/${filename}`, path)
  return `${baseUrl}/artworks/${filename}`
}
