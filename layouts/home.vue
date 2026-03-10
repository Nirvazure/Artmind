<template>
  <v-app :class="['home-layout', { 'layout-gallery': route.path.startsWith('/gallery') }]">
    <v-app-bar
      elevation="0"
      prominent
      :class="[appBarClass, 'app-bar-shell']"
    >
      <img
        src="/icon.png"
        alt="ArtMind"
        class="appbar-logo-icon mr-2"
      >
      <div class="d-flex flex-column">
        <v-toolbar-title class="font-weight-bold">
          ArtMind
        </v-toolbar-title>
        <span class="app-bar-subtitle"> AI 绘画分析引擎</span>
      </div>
      <v-spacer />
      <GalleryFilterBar
        v-if="route.path.startsWith('/gallery')"
        v-model:filter-style="filterStore.selectedStyle"
        v-model:filter-painter="filterStore.selectedPainter"
        :styles="styles"
        :painters="painters"
        :style-cover-map="styleCoverMap"
        class="app-bar-filter"
        compact
      />
      <v-btn
        v-if="route.path.startsWith('/gallery')"
        :to="'/'"
        variant="text"
        class="text-none"
      >
        Home
      </v-btn>
      <v-btn
        v-else
        :to="'/gallery'"
        variant="text"
        class="text-none"
      >
        Gallery
      </v-btn>
    </v-app-bar>
    <v-main :class="mainClass">
      <v-container v-if="!isHome" fluid>
        <slot />
      </v-container>
      <slot v-else />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
interface PainterItem {
  name: string
  style: string
  era?: string
  bio?: string
  verified?: boolean
}

const route = useRoute()
const filterStore = useGalleryFilterStore()
const artworkStore = useArtworkStore()

const { data: paintersData } = await useFetch<PainterItem[]>('/api/painters')
const painters = computed(() => paintersData.value ?? [])

const { data: stylesData } = await useFetch<string[]>('/api/models')
const styles = computed(() => stylesData.value ?? [])

const allItems = computed(() =>
  artworkStore.artworks.map((a) => ({
    id: a.id,
    title: a.title,
    style: a.style,
    imageUrl: a.imageUrl,
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

const isArtworkDetail = computed(() => {
  if (route.path === '/' || route.path === '/gallery') return false
  const segments = route.path.split('/').filter(Boolean)
  return segments.length === 1
})
const isHome = computed(() => route.path === '/' || isArtworkDetail.value)
const mainClass = computed(() => (isHome.value ? 'pa-0 home-main' : 'default-main'))
const appBarClass = computed(() =>
  route.path === '/' || isArtworkDetail.value
    ? 'app-bar-ghost app-bar-home'
    : 'app-bar-ghost app-bar-default'
)
</script>

<style scoped>
.home-layout {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.home-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.home-main > * {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.default-main {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: thin;
  scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
}

.default-main::-webkit-scrollbar {
  width: 8px;
}

.default-main::-webkit-scrollbar-track {
  background: transparent;
}

.default-main::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.18);
  border-radius: 4px;
}

.default-main::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.28);
}

.app-bar-shell {
  flex-shrink: 0;
  z-index: 100;
}

.app-bar-ghost {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: none !important;
  border-bottom: 0 !important;
}

.app-bar-shell :deep(.v-toolbar__content) {
  padding-inline-start: 20px;
}

.appbar-logo-icon {
  margin-inline-start: 4px;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.app-bar-home :deep(.v-btn),
.app-bar-home :deep(.v-toolbar-title),
.app-bar-home .app-bar-subtitle {
  color: rgba(255, 255, 255, 0.94) !important;
}


.app-bar-default :deep(.v-btn),
.app-bar-default :deep(.v-toolbar-title),
.app-bar-default .app-bar-subtitle {
  color: rgba(16, 22, 30, 0.94) !important;
}

.app-bar-subtitle {
  font-size: 0.75rem;
  opacity: 0.82;
  line-height: 1.2;
}

@media (max-width: 599px) {
  .app-bar-shell :deep(.v-toolbar__content) {
    padding-inline-start: 12px;
  }

  .appbar-logo-icon {
    width: 32px;
    height: 32px;
  }

  .app-bar-subtitle {
    display: none;
  }
}

.layout-gallery {
  --gallery-bg: #faf9f7;
  --gallery-text: #2e2c2a;
}

/* 画廊页：接近首页幽灵风格，透明栏 + 黑字（画廊为浅色背景） */
.layout-gallery :deep(.app-bar-shell .v-btn),
.layout-gallery :deep(.app-bar-shell .v-toolbar-title),
.layout-gallery :deep(.app-bar-shell .app-bar-subtitle) {
  color: rgba(16, 22, 30, 0.94) !important;
}

.app-bar-filter {
  margin-inline-end: 12px;
  min-width: 180px;
  max-width: 260px;
}

.app-bar-filter :deep(.v-field) {
  min-height: 40px;
  border-radius: 10px;
}

@media (max-width: 599px) {
  .app-bar-filter {
    min-width: 140px;
    max-width: 180px;
  }
}
</style>
