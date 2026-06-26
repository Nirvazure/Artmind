import type { Artwork, ArtworkAnalysisResult } from '~/stores/artwork'

interface ArtworkRow {
  id: string
  user_id: string
  title: string
  style: string
  image_url: string
  image_width: number | null
  image_height: number | null
  is_public: boolean
  analysis_result: ArtworkAnalysisResult | null
  created_at: string
  artwork_likes?: { user_id: string }[]
}

export function mapArtworkRow(row: ArtworkRow): Artwork {
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    style: row.style,
    imageUrl: row.image_url,
    imageWidth: row.image_width ?? undefined,
    imageHeight: row.image_height ?? undefined,
    isPublic: row.is_public,
    likes: (row.artwork_likes ?? []).map((l) => l.user_id),
    comments: [],
    createdAt: row.created_at,
    analysisResult: row.analysis_result ?? undefined,
  }
}

export const artworkSelectQuery = '*, artwork_likes(user_id)'
