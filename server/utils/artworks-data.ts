import { getSupabaseAdmin } from './supabase-admin'
import type { Json } from '~/types/database.types'

export interface ArtworkAnalysisResult {
  styles: { name: string; confidence: number }[]
  painters: string[]
  rawLabels?: Array<{ label: string; score: number }>
}

export interface Artwork {
  id: string
  userId: string
  title: string
  style: string
  imageUrl: string
  imageWidth?: number
  imageHeight?: number
  isPublic: boolean
  likes: string[]
  comments: { userId: string; text: string }[]
  createdAt: string
  analysisResult?: ArtworkAnalysisResult
}

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

function rowToArtwork(row: ArtworkRow): Artwork {
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

const artworkSelect = '*, artwork_likes(user_id)'

export async function getArtworks(): Promise<Artwork[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('artworks')
    .select(artworkSelect)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as ArtworkRow[]).map(rowToArtwork)
}

export async function getArtworkById(id: string): Promise<Artwork | null> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('artworks')
    .select(artworkSelect)
    .eq('id', id)
    .maybeSingle()
  if (error) throw error
  return data ? rowToArtwork(data as ArtworkRow) : null
}

export async function insertArtwork(artwork: Artwork): Promise<Artwork> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('artworks')
    .insert({
      id: artwork.id,
      user_id: artwork.userId,
      title: artwork.title,
      style: artwork.style,
      image_url: artwork.imageUrl,
      image_width: artwork.imageWidth ?? null,
      image_height: artwork.imageHeight ?? null,
      is_public: artwork.isPublic ?? true,
      status: 'published',
      analysis_result: (artwork.analysisResult ?? null) as unknown as Json,
    })
    .select()
    .single()
  if (error) throw error
  return rowToArtwork({ ...(data as ArtworkRow), artwork_likes: [] })
}

export async function updateArtwork(
  id: string,
  update: { likes?: string[]; analysisResult?: ArtworkAnalysisResult },
): Promise<Artwork | null> {
  const supabase = getSupabaseAdmin()

  if (update.analysisResult !== undefined) {
    const { error } = await supabase
      .from('artworks')
      .update({ analysis_result: update.analysisResult as unknown as Json })
      .eq('id', id)
    if (error) throw error
  }

  if (update.likes !== undefined) {
    const { data: existing } = await supabase
      .from('artwork_likes')
      .select('user_id')
      .eq('artwork_id', id)
    const oldIds = (existing ?? []).map((r) => r.user_id)
    const newIds = update.likes
    const toAdd = newIds.filter((uid) => !oldIds.includes(uid))
    const toRemove = oldIds.filter((uid) => !newIds.includes(uid))
    if (toAdd.length) {
      const { error } = await supabase
        .from('artwork_likes')
        .insert(toAdd.map((user_id) => ({ artwork_id: id, user_id })))
      if (error) throw error
    }
    for (const user_id of toRemove) {
      const { error } = await supabase
        .from('artwork_likes')
        .delete()
        .match({ artwork_id: id, user_id })
      if (error) throw error
    }
  }

  return getArtworkById(id)
}
