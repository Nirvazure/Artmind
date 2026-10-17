<template>
  <div class="gallery-page gallery-theme-light">
    <div class="gallery-workspace">
      <aside class="gallery-style-nav">
        <GalleryStyleRail
          :styles="styles"
          :style-cover-map="styleCoverMap"
          :selected-style="filterStore.selectedStyle"
          :artwork-counts="artworkCounts"
          :total-count="viewArtworks.length"
          @update:selected-style="onStyleChange"
        />
      </aside>
      <div class="gallery-results">
        <GalleryFilterPanel
          class="gallery-filters"
          :scope="scope"
          :only-collected="onlyCollected"
          :loading="loading"
          :filter-style="filterStore.selectedStyle"
          :filtered-count="filteredArtworks.length"
          @update:scope="updateGalleryFilters($event, false)"
          @update:only-collected="updateGalleryFilters($event ? 'community' : scope, $event)"
          @update:filter-style="filterStore.selectedStyle = $event"
        />
        <div v-if="loading" class="gallery-loading">
          <v-progress-circular indeterminate color="primary" size="40" />
        </div>
        <template v-else>
          <div v-if="needsLogin" class="gallery-notice">
            <LucideIcon :name="scope === 'personal' ? 'images' : 'bookmark'" :size="32" />
            <h1>登录后查看{{ scope === 'personal' ? '个人画廊' : '收藏作品' }}</h1>
            <p>在这里浏览你保存的作品和收藏。</p>
            <v-btn to="/login" color="primary" rounded="pill">前往登录</v-btn>
          </div>
          <div v-else-if="viewError" class="gallery-notice" role="alert">
            <p>{{ viewError }}</p>
            <v-btn variant="tonal" rounded="pill" @click="retryLoad">重新加载</v-btn>
          </div>
          <template v-else>
            <v-sheet class="gallery-section m3-section" variant="flat">
              <div class="section-body">
                <GalleryArtworkGrid
                  :artworks="filteredArtworks"
                  :manage-own="scope === 'personal'"
                  :empty-text="emptyText"
                  :has-filters="!!filterStore.selectedStyle"
                  @updated="updateArtwork"
                  @collection-change="updateArtwork"
                  @clear-filters="clearFilters"
                />
              </div>
            </v-sheet>
          </template>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {
  filterGalleryArtworks,
  resolveGalleryFilters,
  selectGalleryArtworks,
  type GalleryScope,
} from '~/utils/gallery-filters'
definePageMeta({ layout: 'home' })

const artworkStore = useArtworkStore()
const filterStore = useGalleryFilterStore()
const route = useRoute()
const router = useRouter()
const auth = useAuth()
const galleryFilters = computed(() => resolveGalleryFilters(route.query))
const scope = computed(() => galleryFilters.value.scope)
const onlyCollected = computed(() => galleryFilters.value.onlyCollected)
const requiresPersonalData = computed(() => scope.value === 'personal' || onlyCollected.value)
const userId = computed(() => auth.user.value?.id)
const personalViewEnabled = computed(() => requiresPersonalData.value && !auth.loading.value)
const {
  myArtworks,
  myCollectedArtworks,
  loading: personalPending,
  error: personalError,
  refresh: refreshPersonalArtworks,
  updateArtwork,
} = useUserArtworks(userId, personalViewEnabled)
const needsLogin = computed(() => requiresPersonalData.value && !auth.isAuthenticated.value)
const viewArtworks = computed(() =>
  selectGalleryArtworks(
    scope.value,
    {
      publicArtworks: artworkStore.artworks,
      myArtworks: myArtworks.value,
      collectedArtworks: myCollectedArtworks.value,
      userId: userId.value,
    },
    onlyCollected.value,
  ),
)

async function updateGalleryFilters(nextScope: GalleryScope, nextOnlyCollected: boolean) {
  await router.push({
    path: '/gallery',
    query: {
      ...route.query,
      scope: nextScope === 'personal' ? 'personal' : undefined,
      collected: nextOnlyCollected ? 'true' : undefined,
      view: undefined,
    },
  })
}

interface GalleryMeta {
  styles: string[]
  styleCovers: Record<string, string>
}

const {
  data: galleryMeta,
  pending: metaPending,
  error: metaError,
  refresh: refreshMeta,
} = await useAsyncData<GalleryMeta>('gallery-meta', () =>
  Promise.all([
    $fetch<string[]>('/api/models'),
    $fetch<Record<string, string>>('/api/style-covers'),
  ]).then(([styles, styleCovers]) => ({ styles, styleCovers })),
)

const {
  pending: artworksPending,
  error: artworksError,
  refresh: refreshPublicArtworks,
} = await useAsyncData('gallery-artworks', async () => {
  if (artworkStore.artworks.length === 0) {
    await artworkStore.fetchArtworks()
  }
  return artworkStore.artworks.length
})

const loading = computed(
  () =>
    metaPending.value ||
    artworksPending.value ||
    (requiresPersonalData.value && (auth.loading.value || personalPending.value)),
)
const viewError = computed(() => {
  if (metaError.value) return '画廊筛选信息加载失败，请重试'
  if (scope.value === 'community' && artworksError.value) return '社区作品加载失败，请重试'
  return requiresPersonalData.value ? personalError.value : ''
})

async function retryLoad() {
  await Promise.all([
    refreshMeta(),
    ...(scope.value === 'community' ? [refreshPublicArtworks()] : []),
    ...(requiresPersonalData.value ? [refreshPersonalArtworks()] : []),
  ])
}

const styles = computed(() => galleryMeta.value?.styles ?? [])

const artworkCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const item of viewArtworks.value) {
    if (item.style) counts[item.style] = (counts[item.style] ?? 0) + 1
  }
  return counts
})

function onStyleChange(style: string | null) {
  filterStore.selectedStyle = style
}

const styleCoverMap = computed(() => {
  const map: Record<string, string> =
    scope.value === 'community' ? { ...(galleryMeta.value?.styleCovers ?? {}) } : {}
  for (const item of viewArtworks.value) {
    if (item.style && item.imageUrl) map[item.style] = item.imageUrl
  }
  return map
})

const filteredArtworks = computed(() =>
  filterGalleryArtworks(viewArtworks.value, filterStore.selectedStyle),
)
const emptyText = computed(() => {
  if (filterStore.selectedStyle) return '没有匹配的作品'
  if (onlyCollected.value) return '当前范围内没有收藏的作品，可取消收藏筛选或切换画廊范围。'
  if (scope.value === 'personal') return '还没有保存作品，分析画作后即可保存到这里。'
  return '社区画廊暂无作品'
})

function clearFilters() {
  filterStore.selectedStyle = null
}
</script>

<style scoped>
.gallery-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: start;
  gap: 20px;
}

.gallery-style-nav,
.gallery-results {
  min-width: 0;
}

.gallery-filters {
  padding-inline: clamp(18px, 2.4vw, 28px);
}

@media (min-width: 960px) {
  .gallery-workspace {
    grid-template-columns: 72px minmax(0, 1fr);
    gap: 20px;
  }

  .gallery-style-nav {
    position: sticky;
    top: 16px;
    z-index: 5;
  }
}

.gallery-notice {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  min-height: 320px;
  padding: 48px 16px;
  text-align: center;
}

.gallery-notice h1 {
  font-size: 1.25rem;
  font-weight: 600;
}

.gallery-notice p {
  color: var(--gallery-text-secondary);
}

.gallery-page {
  min-height: 100%;
  padding: clamp(12px, 2vw, 32px) clamp(20px, 2.8vw, 40px) clamp(20px, 2.8vw, 40px);
  max-width: 1920px;
  margin: 0 auto;
}

@media (min-width: 960px) {
  .gallery-page {
    padding-left: 0;
    max-width: none;
    margin: 0;
  }
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
