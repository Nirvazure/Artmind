import classicArtworksData from '../../data/classic-artworks.json'
import { STYLE_COVER_URLS } from '../../utils/styles-data'

/** 编译时导入，确保 Vercel 等 serverless 环境下可用 */
const classic = classicArtworksData as Array<{ style: string; imageUrl: string }>

export default defineEventHandler(() => {
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
