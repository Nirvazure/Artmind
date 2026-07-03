<template>
  <div class="artwork-grid-wrap">
    <div v-if="filteredArtworks.length === 0" class="grid-empty">
      <p class="grid-empty-text">没有匹配的作品</p>
      <button type="button" class="grid-empty-btn" @click="$emit('clearFilters')">清除筛选</button>
    </div>
    <MasonryWall
      v-else
      :items="visibleItems"
      :column-width="columnWidth"
      :gap="12"
      :ssr-columns="ssrColumns"
      :key-mapper="(item) => item.id"
    >
      <template #default="{ item, index }">
        <GalleryArtworkCard
          :item="item"
          :index="index"
          :painter-names="getPainterNames(item)"
          :is-collected="isCollected(item)"
          :show-collect="auth.isAuthenticated.value"
          @click="goToDetail(item)"
          @toggle-collect="toggleCollect(item.id)"
        />
      </template>
    </MasonryWall>
    <div v-if="filteredArtworks.length > 0" ref="sentinelRef" class="masonry-sentinel" />
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'
import { MasonryWall } from '@yeger/vue-masonry-wall'

const BATCH_SIZE = 24

interface PainterItem {
  name: string
  style: string
}

const props = defineProps<{
  artworks: Artwork[]
  filterStyle: string | null
  filterPainter: string | null
  painters?: PainterItem[]
}>()

defineEmits<{
  clearFilters: []
}>()

function getPainterNames(item: Artwork): string[] {
  if (item.analysisResult?.painters?.length) return item.analysisResult.painters
  const list = (props.painters ?? []).filter((p) => p.style === item.style).map((p) => p.name)
  return list
}

function matchesPainterFilter(item: Artwork, painterName: string): boolean {
  const fromAnalysis = item.analysisResult?.painters ?? []
  if (fromAnalysis.some((p) => p.trim().toLowerCase() === painterName.trim().toLowerCase())) {
    return true
  }
  const fallback = (props.painters ?? []).find((p) => p.name === painterName)
  if (fallback && item.style === fallback.style) return true
  return false
}

const router = useRouter()
const auth = useAuth()
const artworkStore = useArtworkStore()

const filteredArtworks = computed(() => {
  let list = props.artworks
  if (props.filterStyle) {
    list = list.filter((a) => a.style === props.filterStyle)
  }
  if (props.filterPainter) {
    list = list.filter((a) => matchesPainterFilter(a, props.filterPainter!))
  }
  return list
})

const visibleCount = ref(BATCH_SIZE)
const visibleItems = computed(() => filteredArtworks.value.slice(0, visibleCount.value))

const sentinelRef = ref<HTMLElement | null>(null)
const columnWidth = ref(280)
const ssrColumns = 2

function isCollected(item: Artwork) {
  return item.likes.includes(auth.user.value?.id ?? '')
}

function toggleCollect(id: string) {
  artworkStore.toggleLike(id)
}

function goToDetail(item: Artwork) {
  router.push({ path: `/${item.id}`, query: { analyse: 'true' } })
}

function updateColumnWidth() {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  if (w >= 1600) columnWidth.value = 300
  else if (w >= 1280) columnWidth.value = 280
  else if (w >= 960) columnWidth.value = 260
  else if (w >= 600) columnWidth.value = 240
  else if (w >= 360) columnWidth.value = 200
  else columnWidth.value = 160
}

let io: IntersectionObserver | null = null

watch(filteredArtworks, () => {
  visibleCount.value = BATCH_SIZE
})

onMounted(() => {
  updateColumnWidth()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateColumnWidth)
  }

  io = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return
      if (visibleCount.value < filteredArtworks.value.length) {
        visibleCount.value += BATCH_SIZE
      }
    },
    { rootMargin: '100px', threshold: 0 },
  )

  const sentinel = sentinelRef.value
  if (sentinel) io.observe(sentinel)
})

watch(sentinelRef, (el) => {
  if (!io) return
  io.disconnect()
  if (el) io.observe(el)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateColumnWidth)
  }
  if (io) io.disconnect()
})

defineExpose({ filteredCount: computed(() => filteredArtworks.value.length) })
</script>

<style scoped>
.artwork-grid-wrap {
  position: relative;
}

.masonry-sentinel {
  height: 1px;
  visibility: hidden;
}

.grid-empty {
  text-align: center;
  padding: 48px 16px;
}

.grid-empty-text {
  margin: 0 0 12px;
  color: var(--gallery-text-secondary, rgba(46, 44, 42, 0.72));
}

.grid-empty-btn {
  background: none;
  border: none;
  color: var(--gallery-accent, #5c5046);
  text-decoration: underline;
  cursor: pointer;
  font-family: inherit;
}
</style>
