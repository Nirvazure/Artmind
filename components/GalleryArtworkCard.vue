<template>
  <div
    ref="cardRef"
    v-motion
    class="artwork-card"
    :initial="{ opacity: 0, y: 20 }"
    :enter="{ opacity: 1, y: 0, transition: { delay: 50 * Math.min(index, 12), duration: 350, easing: 'ease-out' } }"
    @click="$emit('click')"
  >
    <div
      class="artwork-card-image"
      :style="{ aspectRatio: item.imageWidth && item.imageHeight ? (item.imageWidth / item.imageHeight) : (4/3) }"
    >
      <v-img
        :src="item.imageUrl"
        :alt="item.title"
        contain
        class="artwork-img"
      />
    </div>
    <v-btn
      icon
      variant="text"
      size="small"
      class="artwork-fav-btn"
      :class="{ collected: isCollected }"
      @click.stop="$emit('toggle-collect')"
    >
      <v-icon :icon="isCollected ? 'mdi-bookmark' : 'mdi-bookmark-outline'" size="20" />
    </v-btn>
    <div class="artwork-card-overlay">
      <div class="overlay-content">
        <p class="artwork-title">{{ item.title || '未命名' }}</p>
        <p class="artwork-style">{{ item.style || '—' }}</p>
        <div class="painter-avatars">
          <template v-if="painterNames.length > 0">
            <v-avatar
              v-for="name in painterNames.slice(0, 3)"
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
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'
import VanillaTilt from 'vanilla-tilt'

const props = defineProps<{
  item: Artwork
  index: number
  painterNames: string[]
  isCollected: boolean
}>()

defineEmits<{
  click: []
  'toggle-collect': []
}>()

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=48`
}

const cardRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (cardRef.value && typeof window !== 'undefined') {
    VanillaTilt.init(cardRef.value, { max: 5, glare: true, 'max-glare': 0.15, scale: 1.02 })
  }
})

onUnmounted(() => {
  const el = cardRef.value as (HTMLElement & { vanillaTilt?: { destroy: () => void } }) | null
  if (el?.vanillaTilt) {
    el.vanillaTilt.destroy()
  }
})
</script>

<style scoped>
.artwork-card {
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
  cursor: pointer;
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  min-height: 44px;
  position: relative;
}

.artwork-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.16);
}

.artwork-card:hover .artwork-card-overlay {
  opacity: 1;
}

.artwork-card-image {
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
</style>
