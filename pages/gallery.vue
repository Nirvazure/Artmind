<template>
  <div class="gallery-page">
    <!-- 作品展区 -->
    <v-sheet
      v-motion
      class="gallery-section m3-section"
      variant="flat"
      :initial="{ opacity: 0, y: 14 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 110, duration: 320, easing: 'ease-out' } }"
    >
      <div class="section-body" :key="`gallery-${artworkStore.artworks.length}`">
        <GalleryArtworkGrid :artworks="artworkStore.artworks" :filter-style="effectiveFilterStyle" :painters="painters" />
      </div>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'
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

const effectiveFilterStyle = computed(() => {
  if (filterStore.selectedPainter) {
    const p = painters.value.find((x) => x.name === filterStore.selectedPainter)
    return p?.style ?? null
  }
  return filterStore.selectedStyle
})

onMounted(() => {
  artworkStore.fetchArtworks()
})
</script>

<style scoped>
.gallery-page {
  min-height: 100%;
  padding: clamp(20px, 2.8vw, 40px);
  transition: background-color 0.3s ease, color 0.3s ease;
  max-width: 1920px;
  margin: 0 auto;
}

@media (max-width: 599px) {
  .gallery-page {
    padding: 12px 16px;
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

/* Theme: Dark */
.gallery-theme-dark {
  --gallery-bg: #0d0d0d;
  --gallery-text: #f5f5f0;
  --gallery-text-secondary: rgba(245, 245, 240, 0.7);
  --gallery-accent: #c9a962;
  --gallery-accent-foreground: #0d0d0d;
  --gallery-border: rgba(245, 245, 240, 0.2);
  --gallery-outline: rgba(245, 245, 240, 0.2);
  --gallery-on-surface: #f5f5f0;
  --gallery-on-surface-muted: rgba(245, 245, 240, 0.7);
  --gallery-surface: rgba(255, 255, 255, 0.05);
  background-color: var(--gallery-bg);
  color: var(--gallery-text);
}

/* Theme: Light - 暖白浅色，与暖灰统一强调色系 */
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

/* Theme: Warm - 暖灰，与浅色共用焦糖褐强调 */
.gallery-theme-warm {
  --gallery-bg: #ebe8e4;
  --gallery-text: #3d3935;
  --gallery-text-secondary: rgba(61, 57, 53, 0.75);
  --gallery-accent: #6b5b4f;
  --gallery-accent-foreground: #f5f3f0;
  --gallery-border: rgba(61, 57, 53, 0.15);
  --gallery-outline: rgba(61, 57, 53, 0.15);
  --gallery-on-surface: #3d3935;
  --gallery-on-surface-muted: rgba(61, 57, 53, 0.75);
  --gallery-surface: rgba(107, 91, 79, 0.08);
  background-color: var(--gallery-bg);
  color: var(--gallery-text);
}
</style>

