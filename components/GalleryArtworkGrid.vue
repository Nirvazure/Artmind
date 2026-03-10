<template>
  <div class="artwork-masonry" :style="{ '--masonry-cols': masonryCols }">
    <div
      v-for="item in visibleItems"
      :key="item.id"
      class="artwork-card"
      @click="goToDetail(item)"
    >
      <div class="artwork-card-image">
        <v-img
          :src="item.imageUrl"
          :alt="item.title"
          cover
          aspect-ratio="4/3"
          class="artwork-img"
        />
      </div>
      <v-btn
        icon
        variant="text"
        size="small"
        class="artwork-fav-btn"
        :class="{ collected: isCollected(item) }"
        @click.stop="toggleCollect(item.id)"
      >
        <v-icon :icon="isCollected(item) ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="20" />
      </v-btn>
      <div class="artwork-card-overlay">
        <div class="overlay-content">
          <p class="artwork-title">{{ item.title || '未命名' }}</p>
          <p class="artwork-style">{{ item.style || '—' }}</p>
          <div class="painter-avatars">
            <template v-if="getPainterNames(item).length > 0">
              <v-avatar
                v-for="name in getPainterNames(item).slice(0, 3)"
                :key="name"
                :image="avatarUrl(name)"
                size="24"
                class="painter-avatar"
              />
            </template>
            <v-icon v-else icon="mdi-account-question" size="24" class="painter-icon" />
          </div>
        </div>
      </div>
    </div>
    <div ref="sentinelRef" class="masonry-sentinel" />
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'

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

function getPainterNames(item: Artwork): string[] {
  if (item.analysisResult?.painters?.length) return item.analysisResult.painters
  const list = (props.painters ?? []).filter((p) => p.style === item.style).map((p) => p.name)
  return list
}

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=48`
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
const masonryCols = ref(4)

watch(() => props.filterStyle, () => {
  visibleCount.value = BATCH_SIZE
})

function isCollected(item: Artwork) {
  return item.likes.includes('demo')
}

function toggleCollect(id: string) {
  artworkStore.toggleLike(id)
}

function goToDetail(item: Artwork) {
  router.push({ path: `/${item.id}`, query: { analyse: 'true' } })
}

function updateCols() {
  const w = typeof window !== 'undefined' ? window.innerWidth : 960
  if (w >= 1600) masonryCols.value = 6
  else if (w >= 1280) masonryCols.value = 5
  else if (w >= 960) masonryCols.value = 4
  else if (w >= 600) masonryCols.value = 3
  else if (w >= 360) masonryCols.value = 2
  else masonryCols.value = 1
}

let io: IntersectionObserver | null = null

onMounted(() => {
  updateCols()
  if (typeof window !== 'undefined') {
    window.addEventListener('resize', updateCols)
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
    window.removeEventListener('resize', updateCols)
  }
  if (io && sentinelRef.value) {
    io.disconnect()
  }
})
</script>

<style scoped>
.artwork-masonry {
  column-count: var(--masonry-cols, 4);
  column-gap: 12px;
}

.artwork-card {
  break-inside: avoid;
  margin-bottom: 12px;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  transition: box-shadow 0.2s ease;
  min-height: 44px;
  position: relative;
}

.artwork-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
}

.artwork-card:hover .artwork-card-overlay {
  opacity: 1;
}

.artwork-card-image {
  aspect-ratio: 4/3;
  overflow: hidden;
  display: block;
}

.artwork-img {
  width: 100%;
  height: 100%;
}

.artwork-fav-btn {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 3;
  min-width: 44px;
  min-height: 44px;
  color: rgba(255, 255, 255, 0.95);
}

.artwork-fav-btn.collected {
  color: rgb(var(--v-theme-primary));
}

.artwork-card-overlay {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.75) 0%, rgba(0, 0, 0, 0.35) 40%, transparent 100%);
  opacity: 0;
  transition: opacity 0.25s ease;
  pointer-events: none;
}

.overlay-content {
  padding: 20px 12px 12px;
}

.artwork-title {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
}

.artwork-style {
  margin: 2px 0 6px;
  font-size: 0.75rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.painter-avatars {
  display: flex;
  align-items: center;
  gap: 4px;
}

.painter-avatar {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.painter-icon {
  color: rgba(255, 255, 255, 0.8);
}

.masonry-sentinel {
  height: 1px;
  visibility: hidden;
  break-inside: avoid;
}

@media (min-width: 1600px) {
  .artwork-masonry {
    --masonry-cols: 6;
  }
}

@media (min-width: 1280px) and (max-width: 1599px) {
  .artwork-masonry {
    --masonry-cols: 5;
  }
}

@media (min-width: 960px) and (max-width: 1279px) {
  .artwork-masonry {
    --masonry-cols: 4;
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .artwork-masonry {
    --masonry-cols: 3;
  }
}

@media (min-width: 360px) and (max-width: 599px) {
  .artwork-masonry {
    --masonry-cols: 2;
  }
}

@media (max-width: 359px) {
  .artwork-masonry {
    --masonry-cols: 1;
  }
}
</style>
