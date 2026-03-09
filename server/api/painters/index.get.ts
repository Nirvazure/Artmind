import { readFile } from 'node:fs/promises'
import path from 'node:path'

export interface PainterItem {
  name: string
  style: string
  verified?: boolean
}

export default defineEventHandler(async (): Promise<PainterItem[]> => {
  const dataPath = path.join(process.cwd(), 'server', 'data', 'painters-list.json')
  const data = await readFile(dataPath, 'utf-8').catch(() => '[]')
  return JSON.parse(data)
})
