<template>
  <div class="gallery-page">
    <!-- 流派展区 -->
    <v-sheet
      class="section m3-section mb-8"
      variant="flat"
      v-motion
      :initial="{ opacity: 0, y: 14 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 110, duration: 320, easing: 'ease-out' } }"
    >
      <div class="section-head">
        <div>
          <h2 class="section-title">流派说明</h2>
          <p class="section-subtitle">AI 可识别的 27 种艺术流派</p>
        </div>
      </div>
      <v-divider class="section-divider" />
      <div class="section-body">
        <GalleryStyleStrip v-model="selectedStyle" :styles="styles" :style-cover-map="styleCoverMap" />
      </div>
    </v-sheet>

    <!-- 艺术家展区 -->
    <v-sheet
      class="section m3-section mb-8"
      variant="flat"
      v-motion
      :initial="{ opacity: 0, y: 14 }"
      :enter="{ opacity: 1, y: 0, transition: { delay: 150, duration: 320, easing: 'ease-out' } }"
    >
      <div class="section-head">
        <div>
          <h2 class="section-title">艺术家名录</h2>
          <p class="section-subtitle">画廊收录的艺术家</p>
        </div>
      </div>
      <v-divider class="section-divider" />
      <div class="section-body">
        <GalleryPainterMarquee :painters="painters" />
      </div>
    </v-sheet>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })
import type { Artwork } from '~/stores/artwork'

interface PainterItem {
  name: string
  style: string
  era?: string
  bio?: string
  verified?: boolean
}

const artworkStore = useArtworkStore()

const { data: paintersData } = await useFetch<PainterItem[]>('/api/painters')
const painters = computed(() => paintersData.value ?? [])

const { data: stylesData } = await useFetch<string[]>('/api/models')
const styles = computed(() => stylesData.value ?? [])

const selectedStyle = ref<string | null>(null)

const allItems = computed(() =>
  artworkStore.artworks.map((a: Artwork) => ({
    id: a.id,
    title: a.title,
    style: a.style,
    imageUrl: a.imageUrl,
    likes: a.likes,
  }))
)

const { data: styleCoversData } = await useFetch<Record<string, string>>('/api/style-covers')
const styleCoverMap = computed(() => {
  const map: Record<string, string> = { ...(styleCoversData.value ?? {}) }
  for (const item of allItems.value) {
    if (item.style && item.imageUrl) map[item.style] = item.imageUrl
  }
  return map
})

onMounted(() => {
  artworkStore.fetchArtworks()
})
</script>

<style scoped>
.gallery-page {
  min-height: 100%;
  padding: clamp(16px, 2.3vw, 32px);
  transition: background-color 0.3s ease, color 0.3s ease;
  max-width: 1400px;
  margin: 0 auto;
}



.m3-section {
  padding: clamp(14px, 2vw, 24px);
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent) !important;

}

.section-head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.section-subtitle {
  margin: 4px 0 0;
  font-size: 0.9rem;
  opacity: 0.78;
}

.section-divider {
  margin: 14px 0 16px;
}

.section-body {
  min-height: 64px;
}

.section-title {
  font-size: clamp(1.05rem, 1.4vw, 1.35rem);
  font-weight: 600;
  margin-bottom: 18px;
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

