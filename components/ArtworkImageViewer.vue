<template>
  <v-overlay
    :model-value="modelValue"
    persistent
    class="artwork-viewer-overlay"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="viewer-wrapper" @click="close">
      <div class="viewer-content" @click.stop>
        <img
        ref="imgRef"
        :src="imageUrl"
        :alt="alt ?? ''"
        class="viewer-img"
        :style="imgStyle"
        @click.stop
        @touchstart.prevent="onTouchStart"
        @touchmove.prevent="onTouchMove"
        @touchend="onTouchEnd"
      >
      </div>
    </div>
  </v-overlay>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: boolean
  imageUrl: string
  alt?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const imgRef = ref<HTMLImageElement | null>(null)
const scale = ref(1)
const translateX = ref(0)
const translateY = ref(0)

const imgStyle = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${scale.value})`,
}))

function close() {
  emit('update:modelValue', false)
  scale.value = 1
  translateX.value = 0
  translateY.value = 0
}

let touchStartDistance = 0
let touchStartScale = 1
let touchStartCenterX = 0
let touchStartCenterY = 0
let touchStartTranslateX = 0
let touchStartTranslateY = 0

function getTouchDistance(touches: TouchList): number {
  if (touches.length < 2) return 0
  return Math.hypot(
    touches[1].clientX - touches[0].clientX,
    touches[1].clientY - touches[0].clientY
  )
}

function getTouchCenter(touches: TouchList): { x: number; y: number } {
  if (touches.length < 2) return { x: 0, y: 0 }
  return {
    x: (touches[0].clientX + touches[1].clientX) / 2,
    y: (touches[0].clientY + touches[1].clientY) / 2,
  }
}

function onTouchStart(e: TouchEvent) {
  if (e.touches.length === 2) {
    touchStartDistance = getTouchDistance(e.touches)
    touchStartScale = scale.value
    const c = getTouchCenter(e.touches)
    touchStartCenterX = c.x
    touchStartCenterY = c.y
    touchStartTranslateX = translateX.value
    touchStartTranslateY = translateY.value
  }
}

function onTouchMove(e: TouchEvent) {
  if (e.touches.length === 2) {
    const dist = getTouchDistance(e.touches)
    const newScale = Math.max(1, Math.min(4, (touchStartScale * dist) / touchStartDistance))
    scale.value = newScale

    const c = getTouchCenter(e.touches)
    const dx = c.x - touchStartCenterX
    const dy = c.y - touchStartCenterY
    translateX.value = touchStartTranslateX + dx
    translateY.value = touchStartTranslateY + dy
  }
}

function onTouchEnd() {
  touchStartDistance = 0
}

watch(() => props.modelValue, (val) => {
  if (!val) {
    scale.value = 1
    translateX.value = 0
    translateY.value = 0
  }
})
</script>

<style scoped>
.artwork-viewer-overlay :deep(.v-overlay__scrim) {
  background: rgba(0, 0, 0, 0.9);
}

.viewer-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: zoom-out;
}

.viewer-content {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 44px;
  min-height: 44px;
}

.viewer-img {
  max-width: 95vw;
  max-height: 95vh;
  object-fit: contain;
  touch-action: none;
  user-select: none;
  transition: transform 0.05s ease-out;
}
</style>
