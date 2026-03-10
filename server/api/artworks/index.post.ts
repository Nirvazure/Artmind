import { insertArtwork } from '../../utils/artworks-data'
import type { Artwork } from '../../utils/artworks-data'
import { copyFromTempToArtworks } from '../../utils/storage'
import { randomUUID } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const body = await readBody<{
    title: string
    style: string
    imageUrl: string
    isPublic?: boolean
  }>(event)
  if (!body?.title || !body?.style || !body?.imageUrl) {
    throw createError({
      statusCode: 400,
      message: 'Missing title, style, or imageUrl',
    })
  }
  const imageUrl = await copyFromTempToArtworks(body.imageUrl)
  const newArtwork: Artwork = {
    id: randomUUID(),
    userId: 'demo',
    title: body.title,
    style: body.style,
    imageUrl,
    isPublic: body.isPublic ?? true,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  }
  return insertArtwork(newArtwork)
})
