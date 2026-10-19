import { STORAGE_BUCKET, storageObjectKey, storagePublicUrl } from '../../utils/storage-assets'
import { compressImageToUnder1MB } from './image-compress'
import { getImageContentType } from './image-content-type'
import { getSupabaseAdmin } from './supabase-admin'

type Prefix = 'temp' | 'artworks'

function getSupabaseUrl(): string {
  const config = useRuntimeConfig()
  return (
    (config.public.supabase as { url?: string } | undefined)?.url ??
    process.env.SUPABASE_URL ??
    process.env.NUXT_PUBLIC_SUPABASE_URL ??
    ''
  )
}

/**
 * 保存图片到 Supabase Storage
 * @param prefix temp=分析临时（未保存到画廊），artworks=持久化（保存到画廊或直接上传）
 */
export async function saveFile(
  buffer: Buffer,
  filename: string,
  prefix: Prefix = 'temp',
): Promise<string> {
  if (prefix !== 'temp' && prefix !== 'artworks') throw new Error('Invalid storage prefix')
  const objectName = `${prefix}/${filename}`
  const publicUrl = storagePublicUrl(getSupabaseUrl(), objectName)
  const bufferToSave = await compressImageToUnder1MB(buffer, filename)
  const contentType = await getImageContentType(bufferToSave)
  const storage = getSupabaseAdmin().storage.from(STORAGE_BUCKET)
  const { error } = await storage.upload(objectName, bufferToSave, { contentType, upsert: false })
  if (error) throw error
  return publicUrl
}

/**
 * 将 temp 中的对象复制到 artworks，用于「保存到画廊」时持久化
 * @param tempUrl 本项目公开 bucket 的 temp 对象 URL
 * @returns artworks 的新 URL，若不是本桶 temp URL 则返回原 URL
 */
export async function copyFromTempToArtworks(tempUrl: string): Promise<string> {
  const supabaseUrl = getSupabaseUrl()
  const sourceKey = storageObjectKey(tempUrl, supabaseUrl)
  if (!sourceKey?.startsWith('temp/')) return tempUrl

  const destinationKey = `artworks/${sourceKey.slice('temp/'.length)}`
  const publicUrl = storagePublicUrl(supabaseUrl, destinationKey)
  const storage = getSupabaseAdmin().storage.from(STORAGE_BUCKET)
  const { error } = await storage.copy(sourceKey, destinationKey)
  if (!error) return publicUrl

  const isLegacyDuplicate = error.status === 400 && /already exists|duplicate/i.test(error.message)
  if (
    error.status !== 409 &&
    !['409', 'Duplicate', 'ResourceAlreadyExists'].includes(error.statusCode ?? '') &&
    !isLegacyDuplicate
  ) {
    throw error
  }

  // A retry may follow a successful copy whose response never reached the caller.
  // Accept it only after comparing the source and destination bytes.
  const source = await storage.download(sourceKey)
  if (source.error) throw source.error
  const destination = await storage.download(destinationKey)
  if (destination.error) throw destination.error
  const sourceBytes = Buffer.from(await source.data.arrayBuffer())
  const destinationBytes = Buffer.from(await destination.data.arrayBuffer())
  if (!sourceBytes.equals(destinationBytes)) throw error
  return publicUrl
}
