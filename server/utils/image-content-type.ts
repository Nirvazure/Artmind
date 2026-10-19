import sharp from 'sharp'

const CONTENT_TYPES: Record<string, string> = {
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heif: 'image/heif',
  tiff: 'image/tiff',
}

/** Compression may emit JPEG bytes while preserving the original filename suffix. */
export async function getImageContentType(buffer: Buffer): Promise<string> {
  const metadata = await sharp(buffer).metadata()
  const contentType = metadata.format && CONTENT_TYPES[metadata.format]
  if (!contentType || !metadata.width || !metadata.height) {
    throw new Error('Unsupported or invalid image')
  }
  // libvips reports AVIF as HEIF; its compression identifies the actual MIME type.
  if (metadata.format === 'heif' && metadata.compression === 'av1') return 'image/avif'
  return contentType
}
