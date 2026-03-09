import { readFile } from 'node:fs/promises'
import path from 'node:path'

export interface ClassicArtwork {
  id: string
  title: string
  style: string
  painter: string
  imageUrl: string
}

export default defineEventHandler(async (): Promise<ClassicArtwork[]> => {
  const dataPath = path.join(process.cwd(), 'server', 'data', 'classic-artworks.json')
  const data = await readFile(dataPath, 'utf-8').catch(() => '[]')
  return JSON.parse(data)
})
