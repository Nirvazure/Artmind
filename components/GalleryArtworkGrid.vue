<template>
  <div class="artwork-grid-wrap">
    <div v-if="artworks.length === 0" class="grid-empty">
      <p class="grid-empty-text">{{ emptyText }}</p>
      <button v-if="hasFilters" type="button" class="grid-empty-btn" @click="$emit('clearFilters')">
        清除筛选
      </button>
    </div>
    <MasonryWall
      v-else
      :items="visibleItems"
      :column-width="columnWidth"
      :gap="artworkGap"
      :ssr-columns="ssrColumns"
      :key-mapper="(item) => item.id"
    >
      <template #default="{ item, index }">
        <GalleryArtworkCard
          :item="item"
          :index="index"
          :is-collected="isCollected(item)"
          :show-collect="auth.isAuthenticated.value"
          :collecting="collectingIds.has(item.id)"
          :show-visibility-action="manageOwn && item.userId === auth.user.value?.id"
          :updating-visibility="updatingVisibilityIds.has(item.id)"
          @click="goToDetail(item)"
          @toggle-collect="toggleCollect(item)"
          @toggle-public="togglePublic(item, $event)"
        />
      </template>
    </MasonryWall>
    <div v-if="artworks.length > 0" ref="sentinelRef" class="masonry-sentinel" />
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'
import { MasonryWall } from '@yeger/vue-masonry-wall'

const BATCH_SIZE = 24

const props = withDefaults(
  defineProps<{
    artworks: Artwork[]
    manageOwn?: boolean
    hasFilters?: boolean
    emptyText?: string
  }>(),
  { manageOwn: false, hasFilters: false, emptyText: '没有匹配的作品' },
)

const emit = defineEmits<{
  clearFilters: []
  updated: [artwork: Artwork]
  collectionChange: [artwork: Artwork]
}>()

const router = useRouter()
const auth = useAuth()
const artworkStore = useArtworkStore()
const toast = useToast()

const visibleCount = ref(BATCH_SIZE)
const visibleItems = computed(() => props.artworks.slice(0, visibleCount.value))
const collectingIds = ref(new Set<string>())
const updatingVisibilityIds = ref(new Set<string>())

const sentinelRef = shallowRef<HTMLElement | null>(null)
const columnWidth = ref(280)
const artworkGap = ref(24)
const ssrColumns = 2

function isCollected(item: Artwork) {
  return item.likes.includes(auth.user.value?.id ?? '')
}

async function toggleCollect(item: Artwork) {
  if (collectingIds.value.has(item.id)) return
  collectingIds.value.add(item.id)
  try {
    const before = isCollected(item)
    artworkStore.artworkById[item.id] = item
    await artworkStore.toggleLike(item.id)
    if (before !== isCollected(item)) emit('collectionChange', item)
  } finally {
    collectingIds.value.delete(item.id)
  }
}

async function togglePublic(item: Artwork, isPublic: boolean | null) {
  if (
    isPublic === null ||
    !props.manageOwn ||
    item.userId !== auth.user.value?.id ||
    updatingVisibilityIds.value.has(item.id)
  ) {
    return
  }
  updatingVisibilityIds.value.add(item.id)
  try {
    const updated = await artworkStore.patchArtwork(item.id, { isPublic })
    emit('updated', updated)
    toast.success(isPublic ? '已公开到社区画廊' : '已设为仅自己可见')
  } catch (error: unknown) {
    toast.error(error instanceof Error ? error.message : '更新失败')
  } finally {
    updatingVisibilityIds.value.delete(item.id)
  }
}

function goToDetail(item: Artwork) {
  router.push({ path: `/${item.id}`, query: { analyse: 'true' } })
}

function updateColumnWidth() {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  artworkGap.value = w >= 960 ? 24 : 16
  if (w >= 1600) columnWidth.value = 300
  else if (w >= 1280) columnWidth.value = 280
  else if (w >= 960) columnWidth.value = 260
  else if (w >= 600) columnWidth.value = 240
  else if (w >= 360) columnWidth.value = 200
  else columnWidth.value = 160
}

let io: IntersectionObserver | null = null

watch(
  () => props.artworks,
  () => {
    visibleCount.value = BATCH_SIZE
  },
)

onMounted(() => {
  updateColumnWidth()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateColumnWidth)
  }

  io = new IntersectionObserver(
    (entries) => {
      if (!entries[0]?.isIntersecting) return
      if (visibleCount.value < props.artworks.length) {
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

defineExpose({ filteredCount: computed(() => props.artworks.length) })
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
