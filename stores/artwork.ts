import { defineStore } from 'pinia'

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
      this.artworks = await $fetch<Artwork[]>('/api/artworks')
    },
    async addArtwork(payload: {
      title: string
      style: string
      imageUrl: string
      isPublic: boolean
      analysisResult?: ArtworkAnalysisResult
    }) {
      const created = await $fetch<Artwork>('/api/artworks', {
        method: 'POST',
        body: payload,
      })
      this.artworks.unshift(created)
      return created
    },
    /** 收藏/取消收藏（复用 likes 字段，语义为收藏者 ID 列表） */
    async toggleLike(id: string) {
      const artwork = this.artworks.find((a) => a.id === id)
      if (!artwork) return
      const userId = 'demo'
      const newLikes = artwork.likes.includes(userId)
        ? artwork.likes.filter((uid) => uid !== userId)
        : [...artwork.likes, userId]
      const updated = await $fetch<Artwork>(`/api/artworks/${id}`, {
        method: 'PUT',
        body: { likes: newLikes },
      })
      const idx = this.artworks.findIndex((a) => a.id === id)
      if (idx !== -1) this.artworks[idx] = updated
    },
    async updateArtworkAnalysis(id: string, analysisResult: ArtworkAnalysisResult) {
      const updated = await $fetch<Artwork>(`/api/artworks/${id}`, {
        method: 'PUT',
        body: { analysisResult },
      })
      const idx = this.artworks.findIndex((a) => a.id === id)
      if (idx !== -1) this.artworks[idx] = updated
      return updated
    },
  },
})
