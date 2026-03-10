import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface Artwork {
  id: string
  userId: string
  title: string
  style: string
  imageUrl: string
  isPublic?: boolean
  likes: string[]
  comments: { userId: string; text: string }[]
  createdAt: string
}

const DATA_PATH = path.join(process.cwd(), 'server', 'data', 'artworks.json')

export async function readArtworks(): Promise<Artwork[]> {
  const data = await readFile(DATA_PATH, 'utf-8').catch(() => '[]')
  return JSON.parse(data)
}

export async function writeArtworks(artworks: Artwork[]): Promise<void> {
  try {
    await writeFile(DATA_PATH, JSON.stringify(artworks, null, 2), 'utf-8')
  } catch (e) {
    // Vercel 等 serverless 环境为只读，写入会失败，仅记录不抛出
    if (process.env.NODE_ENV === 'development') {
      console.warn('[artworks-data] writeArtworks failed:', (e as Error).message)
    }
  }
}
