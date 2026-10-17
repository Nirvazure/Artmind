<template>
  <div
    v-motion
    class="artwork-card"
    :class="{ 'has-visibility-action': showVisibilityAction }"
    role="link"
    tabindex="0"
    :aria-label="artworkLabel"
    :initial="{ opacity: 0, y: 20 }"
    :enter="{
      opacity: 1,
      y: 0,
      transition: { delay: 50 * Math.min(index, 12), duration: 350, easing: 'ease-out' },
    }"
    @click="$emit('click')"
    @keydown.enter.self="$emit('click')"
    @keydown.space.self.prevent="$emit('click')"
  >
    <div
      class="artwork-card-image"
      :style="{
        aspectRatio:
          item.imageWidth && item.imageHeight ? item.imageWidth / item.imageHeight : 4 / 3,
      }"
    >
      <v-img :src="item.imageUrl" :alt="artworkLabel" contain class="artwork-img" />
    </div>
    <div class="artwork-actions">
      <v-btn
        v-if="showVisibilityAction"
        icon
        variant="text"
        size="small"
        class="artwork-action-btn"
        :class="{ 'is-public': item.isPublic }"
        :loading="updatingVisibility"
        :disabled="updatingVisibility"
        :aria-label="item.isPublic ? '设为仅自己可见' : '公开到社区画廊'"
        :aria-pressed="item.isPublic"
        @click.stop="$emit('toggle-public', !item.isPublic)"
      >
        <LucideIcon :name="item.isPublic ? 'lockKeyhole' : 'lockKeyholeOpen'" :size="22" />
        <v-tooltip activator="parent" location="bottom">
          {{ item.isPublic ? '已公开 · 点击设为私密' : '仅自己可见 · 点击公开' }}
        </v-tooltip>
      </v-btn>
      <v-btn
        v-if="showCollect"
        icon
        variant="text"
        size="small"
        class="artwork-action-btn artwork-fav-btn"
        :class="{ collected: isCollected }"
        :aria-label="isCollected ? '取消收藏' : '收藏作品'"
        :aria-pressed="isCollected"
        :disabled="collecting"
        @click.stop="$emit('toggle-collect')"
      >
        <LucideIcon name="bookmark" :size="24" :fill="isCollected ? 'currentColor' : 'none'" />
        <v-tooltip activator="parent" location="bottom">
          {{ isCollected ? '取消收藏' : '收藏作品' }}
        </v-tooltip>
      </v-btn>
    </div>
    <div class="artwork-details">
      <p class="artwork-title">{{ styleLabel }}</p>
      <p v-if="artworkName" class="artwork-name">{{ artworkName }}</p>
    </div>
    <div class="artwork-uploader">
      <v-avatar size="28" class="uploader-avatar" :title="uploaderName" :aria-label="uploaderName">
        <v-img
          v-if="item.uploader?.photo && !avatarFailed"
          :src="item.uploader.photo"
          :alt="uploaderName"
          cover
          @error="avatarFailed = true"
        />
        <v-icon v-else icon="mdi-account" size="20" />
      </v-avatar>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'
import { galleryArtworkName } from '~/utils/gallery-display'

const props = withDefaults(
  defineProps<{
    item: Artwork
    index: number
    isCollected: boolean
    showCollect?: boolean
    collecting?: boolean
    showVisibilityAction?: boolean
    updatingVisibility?: boolean
  }>(),
  { showCollect: true, collecting: false, showVisibilityAction: false, updatingVisibility: false },
)

defineEmits<{
  click: []
  'toggle-collect': []
  'toggle-public': [value: boolean | null]
}>()

const avatarFailed = ref(false)
const uploaderName = computed(() => props.item.uploader?.name || '上传者')
const artworkName = computed(() => galleryArtworkName(props.item.title))
const styleLabel = computed(() => props.item.style.trim() || '未分类')
const artworkLabel = computed(() =>
  artworkName.value ? `${styleLabel.value} · ${artworkName.value}` : styleLabel.value,
)

watch(
  () => props.item.uploader?.photo,
  () => {
    avatarFailed.value = false
  },
)
</script>

<style scoped>
.artwork-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  min-height: 44px;
  position: relative;
}

.artwork-card:focus-visible {
  outline: 2px solid var(--gallery-accent, #5c5046);
  outline-offset: 3px;
}

@media (hover: hover) and (prefers-reduced-motion: no-preference) {
  .artwork-card:hover .artwork-img {
    transform: scale(1.05);
  }
}

.artwork-card-image {
  overflow: hidden;
  display: block;
}

.artwork-img {
  width: 100%;
  height: 100%;
  transition: transform 0.35s ease;
}

@media (prefers-reduced-motion: reduce) {
  .artwork-img {
    transition: none;
  }
}

.artwork-actions {
  position: absolute;
  top: 6px;
  right: 6px;
  z-index: 3;
  display: flex;
  gap: 8px;
}

.artwork-action-btn {
  min-width: 44px;
  min-height: 44px;
  background: rgba(0, 0, 0, 0.24);
  color: rgba(255, 255, 255, 0.96);
}

.artwork-action-btn.is-public {
  color: #e5d4ae;
}

.artwork-fav-btn.collected {
  color: #e5484d;
}

.artwork-details {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  padding: 12px 64px 28px 12px;
  background: linear-gradient(
    to bottom,
    rgba(0, 0, 0, 0.75) 0%,
    rgba(0, 0, 0, 0.35) 40%,
    transparent 100%
  );
  pointer-events: none;
}

.has-visibility-action .artwork-details {
  padding-right: 112px;
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

.artwork-name {
  margin: 2px 0 0;
  font-size: 0.75rem;
  opacity: 0.9;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.6);
}

.artwork-uploader {
  position: absolute;
  right: 8px;
  bottom: 8px;
  display: flex;
  color: #fff;
  pointer-events: none;
}

.uploader-avatar {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.5);
  background: #5c5046;
}
</style>
