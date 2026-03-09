import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'

export interface ClassicArtwork {
  id: string
  title: string
  style: string
  painter: string
  imageUrl: string
}

const DATA_PATH = path.join(process.cwd(), 'server', 'data', 'classic-artworks.json')

export async function readClassicArtworks(): Promise<ClassicArtwork[]> {
  const data = await readFile(DATA_PATH, 'utf-8').catch(() => '[]')
  return JSON.parse(data)
}

export async function writeClassicArtworks(items: ClassicArtwork[]): Promise<void> {
  await writeFile(DATA_PATH, JSON.stringify(items, null, 2), 'utf-8')
}
