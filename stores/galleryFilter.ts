import { defineStore } from 'pinia'

export const useGalleryFilterStore = defineStore('galleryFilter', {
  state: () => ({
    selectedStyle: null as string | null,
    selectedPainter: null as string | null,
  }),
})
