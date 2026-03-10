import sharp from 'sharp'

/**
 * 从图片 URL 获取宽高，失败时返回 null
 */
export async function getImageDimensions(
  imageUrl: string
): Promise<{ width: number; height: number } | null> {
  try {
    const buf = await $fetch<ArrayBuffer>(imageUrl)
    const buffer = Buffer.from(buf)
    const metadata = await sharp(buffer).metadata()
    const w = metadata.width
    const h = metadata.height
    if (typeof w === 'number' && typeof h === 'number' && w > 0 && h > 0) {
      return { width: w, height: h }
    }
    return null
  } catch {
    return null
  }
}
