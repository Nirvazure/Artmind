<template>
  <div class="gallery-page gallery-theme-light">
    <div v-if="loading" class="gallery-loading">
      <v-progress-circular indeterminate color="primary" size="40" />
    </div>
    <template v-else>
      <GalleryFilterPanel
        :artworks="artworkStore.artworks"
        :styles="styles"
        :painters="painters"
        :style-cover-map="styleCoverMap"
        :filter-style="filterStore.selectedStyle"
        :filter-painter="filterStore.selectedPainter"
        :filtered-count="filteredCount"
        @update:filter-style="filterStore.selectedStyle = $event"
        @update:filter-painter="filterStore.selectedPainter = $event"
      />

      <v-sheet class="gallery-section m3-section" variant="flat">
        <div class="section-body">
          <GalleryArtworkGrid
            :artworks="artworkStore.artworks"
            :filter-style="filterStore.selectedStyle"
            :filter-painter="filterStore.selectedPainter"
            :painters="painters"
            @clear-filters="clearFilters"
          />
        </div>
      </v-sheet>
    </template>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

interface PainterItem {
  name: string
  style: string
  era?: string
  bio?: string
  verified?: boolean
}

const artworkStore = useArtworkStore()
const filterStore = useGalleryFilterStore()

interface GalleryMeta {
  painters: PainterItem[]
  styles: string[]
  styleCovers: Record<string, string>
}

const { data: galleryMeta, pending: metaPending } = await useAsyncData<GalleryMeta>(
  'gallery-meta',
  () =>
    Promise.all([
      $fetch<PainterItem[]>('/api/painters'),
      $fetch<string[]>('/api/models'),
      $fetch<Record<string, string>>('/api/style-covers'),
    ]).then(([painters, styles, styleCovers]) => ({ painters, styles, styleCovers })),
)

const { pending: artworksPending } = await useAsyncData('gallery-artworks', async () => {
  if (artworkStore.artworks.length === 0) {
    await artworkStore.fetchArtworks()
  }
  return artworkStore.artworks.length
})

const loading = computed(() => metaPending.value || artworksPending.value)

const painters = computed(() => galleryMeta.value?.painters ?? [])
const styles = computed(() => galleryMeta.value?.styles ?? [])

const styleCoverMap = computed(() => {
  const map: Record<string, string> = { ...(galleryMeta.value?.styleCovers ?? {}) }
  for (const item of artworkStore.artworks) {
    if (item.style && item.imageUrl) map[item.style] = item.imageUrl
  }
  return map
})

const filteredCount = computed(() => {
  let list = artworkStore.artworks
  if (filterStore.selectedStyle) {
    list = list.filter((a) => a.style === filterStore.selectedStyle)
  }
  if (filterStore.selectedPainter) {
    const name = filterStore.selectedPainter
    list = list.filter((a) => {
      const fromAnalysis = a.analysisResult?.painters ?? []
      if (fromAnalysis.some((p) => p.trim().toLowerCase() === name.trim().toLowerCase())) {
        return true
      }
      const fallback = painters.value.find((p) => p.name === name)
      return fallback ? a.style === fallback.style : false
    })
  }
  return list.length
})

function clearFilters() {
  filterStore.selectedStyle = null
  filterStore.selectedPainter = null
}
</script>

<style scoped>
.gallery-page {
  min-height: 100%;
  padding: clamp(12px, 2vw, 32px) clamp(20px, 2.8vw, 40px) clamp(20px, 2.8vw, 40px);
  max-width: 1920px;
  margin: 0 auto;
}

@media (max-width: 599px) {
  .gallery-page {
    padding: 8px 12px 16px;
  }
}

.gallery-section.m3-section {
  padding: clamp(18px, 2.4vw, 28px);
  min-height: 72px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent) !important;
}

.section-body {
  min-height: 64px;
}

.gallery-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 320px;
}

.gallery-theme-light {
  --gallery-bg: #faf9f7;
  --gallery-text: #2e2c2a;
  --gallery-text-secondary: rgba(46, 44, 42, 0.72);
  --gallery-accent: #5c5046;
  --gallery-accent-foreground: #faf9f7;
  --gallery-border: rgba(46, 44, 42, 0.12);
  --gallery-outline: rgba(46, 44, 42, 0.12);
  --gallery-on-surface: #2e2c2a;
  --gallery-on-surface-muted: rgba(46, 44, 42, 0.72);
  --gallery-surface: rgba(92, 80, 70, 0.06);
  background-color: var(--gallery-bg);
  color: var(--gallery-text);
}
</style>
