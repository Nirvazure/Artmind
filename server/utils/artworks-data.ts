import { getSupabaseAdmin } from './supabase-admin'
import type { Json } from '~/types/database.types'
import type { Artwork, ArtworkAnalysisResult } from '~/stores/artwork'
import {
  mapArtworkRow as rowToArtwork,
  artworkSelectQuery as artworkSelect,
  type ArtworkRow,
} from '../../composables/useArtworkMapper'

export type { Artwork, ArtworkAnalysisResult } from '~/stores/artwork'

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
      is_public: artwork.isPublic ?? false,
      status: 'published',
      analysis_result: (artwork.analysisResult ?? null) as unknown as Json,
    })
    .select(artworkSelect)
    .single()
  if (error) throw error
  return rowToArtwork({ ...(data as ArtworkRow), artwork_likes: [] })
}

export async function updateArtwork(
  id: string,
  update: {
    title?: string
    style?: string
    isPublic?: boolean
    likes?: string[]
    analysisResult?: ArtworkAnalysisResult
  },
): Promise<Artwork | null> {
  const supabase = getSupabaseAdmin()
  const rowUpdate: {
    title?: string
    style?: string
    is_public?: boolean
    analysis_result?: Json
  } = {}

  if (update.title !== undefined) rowUpdate.title = update.title
  if (update.style !== undefined) rowUpdate.style = update.style
  if (update.isPublic !== undefined) rowUpdate.is_public = update.isPublic
  if (update.analysisResult !== undefined) {
    rowUpdate.analysis_result = update.analysisResult as unknown as Json
  }

  if (Object.keys(rowUpdate).length > 0) {
    const { error } = await supabase.from('artworks').update(rowUpdate).eq('id', id)
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
