<template>
  <article class="user-gallery-card">
    <NuxtLink :to="`/${artwork.id}`" class="gallery-card-link">
      <div
        class="gallery-card-image"
        :class="{ 'is-private': !artwork.isPublic }"
        :style="{
          aspectRatio:
            artwork.imageWidth && artwork.imageHeight
              ? `${artwork.imageWidth / artwork.imageHeight}`
              : '4/3',
        }"
      >
        <v-img :src="artwork.imageUrl" :alt="artwork.title" cover />
        <template v-if="showVisibilityBadge">
          <v-icon
            v-if="!artwork.isPublic"
            icon="mdi-lock"
            size="18"
            class="status-icon status-icon--private"
          />
          <v-icon v-else icon="mdi-earth" size="16" class="status-icon status-icon--public" />
        </template>
      </div>
    </NuxtLink>
    <div class="gallery-card-footer">
      <NuxtLink :to="`/${artwork.id}`" class="gallery-card-title">
        {{ artwork.title || '未命名作品' }}
      </NuxtLink>
      <div v-if="showPublicSwitch" class="gallery-card-switch" @click.stop>
        <v-switch
          :model-value="artwork.isPublic"
          :loading="toggling"
          :disabled="toggling"
          density="compact"
          hide-details
          color="primary"
          label="公开"
          @update:model-value="onTogglePublic"
        />
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'

const props = withDefaults(
  defineProps<{
    artwork: Artwork
    showPublicSwitch?: boolean
    showVisibilityBadge?: boolean
  }>(),
  {
    showPublicSwitch: true,
    showVisibilityBadge: true,
  },
)

const emit = defineEmits<{
  updated: [artwork: Artwork]
}>()

const artworkStore = useArtworkStore()
const toast = useToast()
const toggling = ref(false)

async function onTogglePublic(nextValue: boolean | null) {
  if (nextValue === null || toggling.value) return
  toggling.value = true
  try {
    const updated = await artworkStore.patchArtwork(props.artwork.id, {
      isPublic: nextValue,
    })
    emit('updated', updated)
    if (nextValue) {
      await artworkStore.fetchArtworks()
    }
    toast.success(nextValue ? '已公开到社区画廊' : '已设为仅自己可见')
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : '更新失败')
  } finally {
    toggling.value = false
  }
}
</script>

<style scoped>
.user-gallery-card {
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.user-gallery-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.gallery-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
}

.gallery-card-image {
  overflow: hidden;
  display: block;
  position: relative;
}

.gallery-card-image.is-private {
  opacity: 0.92;
}

.status-icon {
  position: absolute;
  top: 8px;
  right: 8px;
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.4));
}

.status-icon--private {
  color: rgba(255, 255, 255, 0.95);
}

.status-icon--public {
  color: rgba(201, 169, 98, 0.95);
}

.gallery-card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-card-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 12px 12px;
}

.gallery-card-title {
  flex: 1;
  min-width: 0;
  font-size: 0.9rem;
  font-weight: 500;
  text-decoration: none;
  color: inherit;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.gallery-card-switch :deep(.v-label) {
  font-size: 0.78rem;
  opacity: 0.85;
}
</style>
