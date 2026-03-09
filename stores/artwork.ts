import { defineStore } from 'pinia'

export interface Artwork {
  id: string
  userId: string
  title: string
  style: string
  imageUrl: string
  isPublic: boolean
  likes: string[]
  comments: { userId: string; text: string }[]
  createdAt: string
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
    }) {
      const created = await $fetch<Artwork>('/api/artworks', {
        method: 'POST',
        body: payload,
      })
      this.artworks.unshift(created)
      return created
    },
    async deleteArtwork(id: string) {
      await $fetch(`/api/artworks/${id}`, { method: 'DELETE' })
      this.artworks = this.artworks.filter((a) => a.id !== id)
    },
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
  },
})
