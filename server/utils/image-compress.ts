import sharp from 'sharp'

const MAX_BYTES = 1024 * 1024 // 1MB
const MAX_DIMENSION = 2000

const IMAGE_EXT = /\.(jpg|jpeg|png|webp)$/i

function isImage(filename: string): boolean {
  return IMAGE_EXT.test(filename)
}

/**
 * 将图片压缩至 1MB 以内，非图片或失败时返回原 buffer
 */
export async function compressImageToUnder1MB(
  buffer: Buffer,
  filename: string
): Promise<Buffer> {
  if (!isImage(filename) || buffer.length <= MAX_BYTES) {
    return buffer
  }
  try {
    let result = await sharp(buffer)
      .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer()

    if (result.length <= MAX_BYTES) return result

    for (const q of [70, 55, 40, 30]) {
      result = await sharp(buffer)
        .resize(MAX_DIMENSION, MAX_DIMENSION, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: q })
        .toBuffer()
      if (result.length <= MAX_BYTES) return result
    }
    return result
  } catch {
    return buffer
  }
}
