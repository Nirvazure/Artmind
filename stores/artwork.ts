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

    artworkById: {} as Record<string, Artwork>,
  }),

  getters: {
    cachedArtworkById:
      (state) =>
      (id: string): Artwork | null =>
        state.artworkById[id] ?? state.artworks.find((a) => a.id === id) ?? null,
  },

  actions: {
    cacheArtwork(artwork: Artwork) {
      this.artworkById[artwork.id] = artwork

      const idx = this.artworks.findIndex((a) => a.id === artwork.id)
      if (artwork.isPublic) {
        if (idx === -1) this.artworks.unshift(artwork)
        else this.artworks[idx] = artwork
      } else if (idx !== -1) {
        this.artworks.splice(idx, 1)
      }

      return artwork
    },

    async fetchArtworks() {
      const supabase = useSupabaseClient()

      const { data, error } = await supabase

        .from('artworks')

        .select(artworkSelectQuery)

        .eq('is_public', true)

        .eq('status', 'published')

        .order('created_at', { ascending: false })

      if (error) throw error

      const artworks = (data ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )
      this.artworks = artworks
      for (const artwork of artworks) {
        this.artworkById[artwork.id] = artwork
      }
    },

    async fetchArtworkById(id: string): Promise<Artwork | null> {
      const cached = this.cachedArtworkById(id)

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

      return this.cacheArtwork(artwork)
    },

    async addArtwork(payload: {
      title: string

      style: string

      imageUrl: string

      isPublic: boolean

      aiPainters?: string[]

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

      return this.cacheArtwork(created)
    },

    async patchArtwork(
      id: string,

      payload: {
        title?: string

        style?: string

        isPublic?: boolean

        aiPainters?: string[]

        analysisResult?: ArtworkAnalysisResult
      },
    ) {
      const auth = useAuth()

      const token = await auth.getAccessToken()

      if (!token) throw new Error('请先登录')

      const updated = await $fetch<Artwork>(`/api/artworks/${id}`, {
        method: 'PATCH',

        body: payload,

        headers: { Authorization: `Bearer ${token}` },
      })

      return this.cacheArtwork(updated)
    },

    async toggleLike(id: string) {
      const toast = useToast()

      try {
        const auth = useAuth()

        const userId = auth.user.value?.id

        if (!userId) throw new Error('请先登录')

        const artwork = this.cachedArtworkById(id)

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
      const auth = useAuth()

      const token = await auth.getAccessToken()

      const headers = token ? { Authorization: `Bearer ${token}` } : undefined

      const updated = await $fetch<Artwork>(`/api/artworks/${id}/analysis`, {
        method: 'PUT',

        body: { analysisResult },

        headers,
      })

      return this.cacheArtwork(updated)
    },
  },
})
