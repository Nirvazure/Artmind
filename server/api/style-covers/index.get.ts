import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { STYLE_COVER_URLS } from '../../utils/styles-data'

export default defineEventHandler(async () => {
  const dataPath = path.join(process.cwd(), 'server', 'data', 'classic-artworks.json')
  const data = await readFile(dataPath, 'utf-8').catch(() => '[]')
  const classic = JSON.parse(data) as Array<{ style: string; imageUrl: string }>

  const map: Record<string, string> = {}
  for (const item of classic) {
    if (item.style && item.imageUrl && !map[item.style]) {
      map[item.style] = item.imageUrl
    }
  }
  for (const [style, url] of Object.entries(STYLE_COVER_URLS)) {
    if (!map[style]) map[style] = url
  }
  return map
})
