<template>
  <div ref="stripRef" class="style-tile-strip" @wheel="onWheelHorizontalScroll">
    <button
      type="button"
      class="style-tile"
      :class="{ active: !selectedStyle }"
      @click="$emit('update:selectedStyle', null)"
    >
      <div class="tile-inner tile-all">
        <span class="tile-label">全部</span>
      </div>
    </button>
    <button
      v-for="style in sortedStyles"
      :key="style"
      type="button"
      class="style-tile"
      :class="{ active: selectedStyle === style }"
      @click="$emit('update:selectedStyle', style)"
    >
      <div class="tile-inner">
        <v-img v-if="styleCoverMap[style]" :src="styleCoverMap[style]" cover class="tile-cover" />
        <div v-else class="tile-cover tile-cover-fallback" />
        <div class="tile-gradient" />
        <span class="tile-label">{{ style }}</span>
      </div>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  styles: string[]
  styleCoverMap: Record<string, string>
  selectedStyle: string | null
  artworkCounts: Record<string, number>
}>()

defineEmits<{
  'update:selectedStyle': [value: string | null]
}>()

const stripRef = ref<HTMLElement | null>(null)

const sortedStyles = computed(() => {
  return [...props.styles].sort((a, b) => {
    const diff = (props.artworkCounts[b] ?? 0) - (props.artworkCounts[a] ?? 0)
    if (diff !== 0) return diff
    if (props.styleCoverMap[a] && !props.styleCoverMap[b]) return -1
    if (!props.styleCoverMap[a] && props.styleCoverMap[b]) return 1
    return a.localeCompare(b, 'zh-CN')
  })
})

function onWheelHorizontalScroll(event: WheelEvent) {
  const strip = stripRef.value
  if (!strip) return
  if (strip.scrollWidth <= strip.clientWidth) return

  const scrollDelta = event.deltaY || event.deltaX
  if (scrollDelta === 0) return

  event.preventDefault()
  strip.scrollLeft += scrollDelta
}
</script>

<style scoped>
.style-tile-strip {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 4px;
  overscroll-behavior-x: contain;
}

.style-tile-strip::-webkit-scrollbar {
  display: none;
}

.style-tile {
  flex: 0 0 auto;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  scroll-snap-align: start;
}

.tile-inner {
  position: relative;
  width: 72px;
  height: 80px;
  border-radius: 10px;
  overflow: hidden;
  border: 2px solid transparent;
  transition:
    transform 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.style-tile:hover .tile-inner {
  transform: scale(1.03);
}

.style-tile.active .tile-inner {
  border-color: var(--gallery-accent, #5c5046);
  box-shadow: 0 4px 16px rgba(92, 80, 70, 0.2);
}

.tile-all {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gallery-surface, rgba(92, 80, 70, 0.06));
  border: 1px solid var(--gallery-border, rgba(46, 44, 42, 0.12));
}

.tile-cover {
  width: 100%;
  height: 100%;
}

.tile-cover-fallback {
  background: linear-gradient(145deg, rgba(92, 80, 70, 0.15), rgba(46, 44, 42, 0.08));
}

.tile-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.65) 0%, transparent 55%);
  pointer-events: none;
}

.tile-label {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  padding: 0 4px;
  font-size: 0.68rem;
  font-weight: 600;
  text-align: center;
  color: #fff;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.2;
}

.tile-all .tile-label {
  position: static;
  color: var(--gallery-text, #2e2c2a);
  text-shadow: none;
  font-size: 0.8rem;
}
</style>
