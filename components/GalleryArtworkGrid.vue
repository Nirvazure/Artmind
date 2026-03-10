<template>
  <div class="artwork-grid-wrap" :key="`grid-${artworks.length}`">
    <MasonryWall
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
          @click="goToDetail(item)"
          @toggle-collect="toggleCollect(item.id)"
        />
      </template>
    </MasonryWall>
    <div ref="sentinelRef" class="masonry-sentinel" />
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
  painters?: PainterItem[]
}>()

const artworks = computed(() => props.artworks)

function getPainterNames(item: Artwork): string[] {
  if (item.analysisResult?.painters?.length) return item.analysisResult.painters
  const list = (props.painters ?? []).filter((p) => p.style === item.style).map((p) => p.name)
  return list
}

const router = useRouter()
const artworkStore = useArtworkStore()

const filteredArtworks = computed(() =>
  props.filterStyle
    ? props.artworks.filter((a) => a.style === props.filterStyle)
    : props.artworks
)

const visibleCount = ref(BATCH_SIZE)
const visibleItems = computed(() =>
  filteredArtworks.value.slice(0, visibleCount.value)
)

const sentinelRef = ref<HTMLElement | null>(null)
const columnWidth = ref(280)
const ssrColumns = 2

function isCollected(item: Artwork) {
  return item.likes.includes('demo')
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
    { rootMargin: '100px', threshold: 0 }
  )

  const sentinel = sentinelRef.value
  if (sentinel) io.observe(sentinel)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', updateColumnWidth)
  }
  if (io) io.disconnect()
})
</script>

<style scoped>
.artwork-grid-wrap {
  position: relative;
}

.masonry-sentinel {
  height: 1px;
  visibility: hidden;
}
</style>
