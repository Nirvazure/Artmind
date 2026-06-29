import { defineStore } from 'pinia'
import { mapArtworkRow, artworkSelectQuery } from '~/composables/useArtworkMapper'

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

export const useArtworkStore = defineStore('artwork', {
  state: () => ({
    artworks: [] as Artwork[],
  }),
  actions: {
    async fetchArtworks() {
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('artworks')
        .select(artworkSelectQuery)
        .eq('is_public', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
      if (error) throw error
      this.artworks = (data ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )
    },

    async fetchArtworkById(id: string): Promise<Artwork | null> {
      const cached = this.artworks.find((a) => a.id === id)
      if (cached) return cached
      const supabase = useSupabaseClient()
      const { data, error } = await supabase
        .from('artworks')
        .select(artworkSelectQuery)
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      if (!data) return null
      const artwork = mapArtworkRow(data as Parameters<typeof mapArtworkRow>[0])
      const idx = this.artworks.findIndex((a) => a.id === id)
      if (idx === -1) this.artworks.push(artwork)
      else this.artworks[idx] = artwork
      return artwork
    },

    async addArtwork(payload: {
      title: string
      style: string
      imageUrl: string
      isPublic: boolean
      analysisResult?: ArtworkAnalysisResult
    }) {
      const auth = useAuth()
      const token = await auth.getAccessToken()
      if (!token) throw new Error('请先登录后再保存到画廊')
      const created = await $fetch<Artwork>('/api/artworks', {
        method: 'POST',
        body: payload,
        headers: { Authorization: `Bearer ${token}` },
      })
      this.artworks.unshift(created)
      return created
    },

    async toggleLike(id: string) {
      const toast = useToast()
      try {
        const auth = useAuth()
        const userId = auth.user.value?.id
        if (!userId) throw new Error('请先登录')
        const artwork = this.artworks.find((a) => a.id === id)
        if (!artwork) return
        const wasCollected = artwork.likes.includes(userId)
        const supabase = useSupabaseClient()
        if (wasCollected) {
          const { error } = await supabase
            .from('artwork_likes')
            .delete()
            .match({ artwork_id: id, user_id: userId })
          if (error) throw error
          artwork.likes = artwork.likes.filter((uid) => uid !== userId)
        } else {
          const { error } = await supabase
            .from('artwork_likes')
            .insert({ artwork_id: id, user_id: userId })
          if (error) throw error
          artwork.likes = [...artwork.likes, userId]
        }
        toast.success(wasCollected ? '已取消收藏' : '已收藏')
      } catch (err) {
        const msg = (err as Error)?.message ?? '操作失败'
        toast.error(msg)
      }
    },

    async updateArtworkAnalysis(id: string, analysisResult: ArtworkAnalysisResult) {
      const updated = await $fetch<Artwork>(`/api/artworks/${id}/analysis`, {
        method: 'PUT',
        body: { analysisResult },
      })
      const idx = this.artworks.findIndex((a) => a.id === id)
      if (idx !== -1) this.artworks[idx] = updated
      return updated
    },
  },
})
