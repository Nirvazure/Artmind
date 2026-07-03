import type { Json } from '~/types/database.types'
import { getSupabaseAdmin } from './supabase-admin'
import type { ArtworkAnalysisResult } from './artworks-data'

export interface StyleCorrectionInput {
  userId: string | null
  artworkId: string | null
  imageUrl: string
  aiTopStyle: string
  aiStyles: ArtworkAnalysisResult['styles']
  userStyle: string
  aiPainters: string[]
  userPainters: string[]
  rawLabels?: ArtworkAnalysisResult['rawLabels']
}

export async function insertStyleCorrection(input: StyleCorrectionInput): Promise<void> {
  const supabase = getSupabaseAdmin()
  const { error } = await supabase.from('style_corrections').insert({
    user_id: input.userId,
    artwork_id: input.artworkId,
    image_url: input.imageUrl,
    ai_top_style: input.aiTopStyle,
    ai_styles: input.aiStyles as unknown as Json,
    user_style: input.userStyle,
    ai_painters: input.aiPainters as unknown as Json,
    user_painters: input.userPainters as unknown as Json,
    raw_labels: (input.rawLabels ?? null) as unknown as Json,
  })
  if (error) throw error
}
