<template>
  <div class="gallery-page gallery-theme-light">
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

    <v-sheet
      v-motion
      class="gallery-section m3-section"
      variant="flat"
      :initial="{ opacity: 0, y: 14 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 110, duration: 320, easing: 'ease-out' } }"
    >
      <div :key="`gallery-${artworkStore.artworks.length}`" class="section-body">
        <GalleryArtworkGrid
          :artworks="artworkStore.artworks"
          :filter-style="filterStore.selectedStyle"
          :filter-painter="filterStore.selectedPainter"
          :painters="painters"
          @clear-filters="clearFilters"
        />
      </div>
    </v-sheet>
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

const { data: paintersData } = await useFetch<PainterItem[]>('/api/painters')
const painters = computed(() => paintersData.value ?? [])

const { data: stylesData } = await useFetch<string[]>('/api/models')
const styles = computed(() => stylesData.value ?? [])

const { data: styleCoversData } = await useFetch<Record<string, string>>('/api/style-covers')
const styleCoverMap = computed(() => {
  const map: Record<string, string> = { ...(styleCoversData.value ?? {}) }
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

onMounted(() => {
  artworkStore.fetchArtworks()
})
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
