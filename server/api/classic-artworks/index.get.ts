import classicArtworksData from '../../data/classic-artworks.json'

export interface ClassicArtwork {
  id: string
  title: string
  style: string
  painter: string
  imageUrl: string
}

/** 编译时导入，确保 Vercel 等 serverless 环境下可用 */
const list = classicArtworksData as ClassicArtwork[]

export default defineEventHandler((): ClassicArtwork[] => list)
