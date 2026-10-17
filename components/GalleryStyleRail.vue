<template>
  <nav class="style-rail" :style="{ '--style-count': options.length }" aria-label="流派循环筛选">
    <button
      type="button"
      class="rail-step"
      :disabled="options.length < 2"
      aria-label="上一个流派"
      @click="move(-1)"
    >
      <LucideIcon name="chevronUp" :size="18" />
    </button>
    <div
      ref="listRef"
      class="rail-list"
      @wheel="onWheel"
      @scroll.passive="onScroll"
      @pointerdown="stopAnimation"
      @keydown="onKeydown"
    >
      <div
        v-for="cycle in options.length > 1 ? [0, 1, 2] : [1]"
        :key="cycle"
        class="rail-cycle"
        :data-cycle="cycle"
        :aria-hidden="cycle !== 1 ? true : undefined"
      >
        <div v-for="(style, index) in options" :key="style" class="rail-tile">
          <button
            type="button"
            class="rail-item"
            :class="{ 'is-active': selectedStyle === style }"
            :tabindex="cycle === 1 ? 0 : -1"
            :data-index="index"
            :aria-pressed="selectedStyle === style"
            :aria-label="`${style} · ${count(style)} 幅作品`"
            @mousedown="cycle !== 1 && $event.preventDefault()"
            @click="select(style, index, cycle)"
            @focus="cycle === 1 && reveal($event.target as HTMLElement)"
          >
            <span class="rail-cover">
              <v-img v-if="styleCoverMap[style]" :src="styleCoverMap[style]" alt="" cover />
            </span>
            <span class="rail-count" aria-hidden="true">{{ count(style) }}</span>
            <v-tooltip
              activator="parent"
              :location="vertical ? 'right' : 'bottom'"
              :open-delay="100"
            >
              <span class="rail-tooltip">
                <strong>{{ style }}</strong>
                <span>{{ count(style) }} 幅作品</span>
              </span>
            </v-tooltip>
          </button>
          <button
            v-if="selectedStyle === style"
            type="button"
            class="rail-clear"
            :tabindex="cycle === 1 ? 0 : -1"
            :data-index="index"
            :aria-label="`取消${style}筛选`"
            @mousedown="cycle !== 1 && $event.preventDefault()"
            @click.stop="clearSelection(index)"
          >
            <LucideIcon name="x" :size="12" />
          </button>
        </div>
      </div>
    </div>
    <button
      type="button"
      class="rail-step"
      :disabled="options.length < 2"
      aria-label="下一个流派"
      @click="move(1)"
    >
      <LucideIcon name="chevronDown" :size="18" />
    </button>
  </nav>
</template>

<script setup lang="ts">
import { normalizeGalleryLoopOffset } from '~/utils/gallery-display'

const props = defineProps<{
  styles: string[]
  styleCoverMap: Record<string, string>
  selectedStyle: string | null
  artworkCounts: Record<string, number>
}>()

const emit = defineEmits<{
  'update:selectedStyle': [value: string | null]
}>()

const options = computed(() => [...new Set(props.styles)])
const listRef = shallowRef<HTMLElement | null>(null)
const vertical = ref(true)
let cycleSize = 0
let animationFrame = 0

function count(style: string) {
  return props.artworkCounts[style] ?? 0
}

function offset() {
  const list = listRef.value
  return (vertical.value ? list?.scrollTop : list?.scrollLeft) ?? 0
}

function setOffset(value: number) {
  const list = listRef.value
  if (!list || !cycleSize) return
  const normalized = normalizeGalleryLoopOffset(value, cycleSize)
  if (vertical.value) list.scrollTop = normalized
  else list.scrollLeft = normalized
}

function stopAnimation() {
  cancelAnimationFrame(animationFrame)
  animationFrame = 0
}

function animateBy(distance: number) {
  stopAnimation()
  if (!cycleSize) return
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    setOffset(offset() + distance)
    return
  }
  const start = performance.now()
  const from = offset()
  function frame(now: number) {
    const progress = Math.min(1, (now - start) / 220)
    setOffset(from + distance * (1 - (1 - progress) ** 3))
    if (progress < 1) animationFrame = requestAnimationFrame(frame)
    else animationFrame = 0
  }
  animationFrame = requestAnimationFrame(frame)
}

function move(direction: number) {
  animateBy(direction * (cycleSize / options.value.length))
}

function onScroll() {
  if (!cycleSize) return
  const current = offset()
  if (current < cycleSize || current >= cycleSize * 2) setOffset(current)
}

function onWheel(event: WheelEvent) {
  if (event.ctrlKey || !cycleSize) return
  // On phones/tablets a vertical wheel still scrolls the page normally.
  if (!vertical.value && Math.abs(event.deltaY) > Math.abs(event.deltaX) && !event.shiftKey) return
  const delta = vertical.value ? event.deltaY || event.deltaX : event.deltaX || event.deltaY
  if (!delta) return
  event.preventDefault()
  stopAnimation()
  const list = listRef.value
  const unit =
    event.deltaMode === 1
      ? 16
      : event.deltaMode === 2
        ? ((vertical.value ? list?.clientHeight : list?.clientWidth) ?? 1)
        : 1
  setOffset(offset() + delta * unit)
}

function reveal(item: HTMLElement) {
  const list = listRef.value
  if (!list || !cycleSize) return
  const rect = item.getBoundingClientRect()
  const view = list.getBoundingClientRect()
  const start = vertical.value ? rect.top : rect.left
  const end = vertical.value ? rect.bottom : rect.right
  const viewStart = vertical.value ? view.top : view.left
  const viewEnd = vertical.value ? view.bottom : view.right
  if (start >= viewStart && end <= viewEnd) return
  const distance = (start + end - viewStart - viewEnd) / 2
  // Choose the nearest equivalent tile across the circular boundary.
  animateBy(distance - Math.round(distance / cycleSize) * cycleSize)
}

function middleButtons() {
  return Array.from(
    listRef.value?.querySelectorAll<HTMLButtonElement>('[data-cycle="1"] .rail-item') ?? [],
  )
}

function select(style: string, index: number, cycle: number) {
  emit('update:selectedStyle', style)
  if (cycle !== 1) middleButtons()[index]?.focus({ preventScroll: true })
}

function clearSelection(index: number) {
  middleButtons()[index]?.focus({ preventScroll: true })
  emit('update:selectedStyle', null)
}

function onKeydown(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
  const buttons = middleButtons()
  const index = Number((event.target as HTMLElement).dataset.index)
  if (!Number.isInteger(index) || !buttons.length) return
  const previous = vertical.value ? 'ArrowUp' : 'ArrowLeft'
  const next = vertical.value ? 'ArrowDown' : 'ArrowRight'
  let target = index
  if (event.key === previous) target = (index - 1 + buttons.length) % buttons.length
  else if (event.key === next) target = (index + 1) % buttons.length
  else if (event.key === 'Home') target = 0
  else if (event.key === 'End') target = buttons.length - 1
  else return
  event.preventDefault()
  buttons[target]?.focus({ preventScroll: true })
}

async function resetLoop() {
  await nextTick()
  stopAnimation()
  const list = listRef.value
  const middle = list?.querySelector<HTMLElement>('[data-cycle="1"]')
  if (!list || !middle) return
  vertical.value = window.matchMedia('(min-width: 960px)').matches
  cycleSize =
    options.value.length > 1 ? (vertical.value ? middle.offsetHeight : middle.offsetWidth) : 0
  list.scrollTop = 0
  list.scrollLeft = 0
  setOffset(cycleSize)
  const selected = middle.querySelector<HTMLElement>('.is-active')
  if (selected) reveal(selected)
}

let resizeObserver: ResizeObserver | undefined
onMounted(() => {
  resizeObserver = new ResizeObserver(() => {
    void resetLoop()
  })
  if (listRef.value) resizeObserver.observe(listRef.value)
  void resetLoop()
})
onUnmounted(() => {
  resizeObserver?.disconnect()
  stopAnimation()
})
watch(options, resetLoop, { flush: 'post' })
</script>

<style scoped>
.style-rail {
  --rail-size: 64px;
  --rail-gap: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  min-width: 0;
}

.rail-step {
  display: grid;
  flex: 0 0 44px;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  color: var(--gallery-text-secondary);
  cursor: pointer;
}

.rail-step:hover {
  background: var(--gallery-surface);
  color: var(--gallery-accent);
}

.rail-step:disabled {
  opacity: 0.3;
  cursor: default;
}

.rail-step svg {
  transform: rotate(-90deg);
}

.rail-list {
  position: relative;
  display: flex;
  flex: 1;
  min-width: 0;
  max-width: calc(var(--style-count) * 76px);
  height: 72px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  overscroll-behavior-x: contain;
  overflow-anchor: none;
}

.rail-list::-webkit-scrollbar {
  display: none;
}

.rail-cycle {
  display: flex;
  flex: none;
  align-items: center;
  gap: var(--rail-gap);
  padding-right: var(--rail-gap);
}

.rail-tile {
  position: relative;
  flex: 0 0 var(--rail-size);
  width: var(--rail-size);
  height: var(--rail-size);
}

.rail-item {
  position: relative;
  width: 100%;
  height: 100%;
  padding: 3px;
  border: 2px solid transparent;
  border-radius: 16px;
  color: var(--gallery-accent);
  background: transparent;
  cursor: pointer;
  transition:
    border-color 0.18s ease,
    background 0.18s ease;
}

.rail-item:hover,
.rail-item.is-active {
  border-color: var(--gallery-accent);
  background: var(--gallery-surface);
}

.rail-step:focus-visible,
.rail-item:focus-visible,
.rail-clear:focus-visible {
  outline: 2px solid var(--gallery-accent);
  outline-offset: -2px;
}

.rail-cover {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: 10px;
  background: color-mix(in srgb, var(--gallery-bg) 80%, var(--gallery-text) 20%);
}

.rail-cover :deep(.v-img) {
  width: 100%;
  height: 100%;
}

.rail-item:not(.is-active) .rail-cover :deep(.v-img) {
  filter: grayscale(1);
  opacity: 0.55;
}

.rail-count {
  position: absolute;
  inset: 5px;
  z-index: 1;
  display: grid;
  place-items: center;
  color: #fff;
  font-family: 'Segoe UI', Arial, sans-serif;
  font-size: 2rem;
  font-weight: 400;
  line-height: 1.2;
  text-align: center;
  font-variant-numeric: lining-nums tabular-nums;
  text-shadow:
    0 1px 3px rgb(0 0 0 / 55%),
    0 0 8px rgb(0 0 0 / 25%);
  pointer-events: none;
}

.rail-clear {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 2px solid var(--gallery-bg);
  border-radius: 50%;
  color: var(--gallery-accent-foreground);
  background: var(--gallery-accent);
  cursor: pointer;
}

.rail-clear:hover {
  color: var(--gallery-bg);
  background: var(--gallery-text);
}

.rail-tooltip {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 2px;
}

.rail-tooltip strong {
  font-size: 0.875rem;
  font-weight: 600;
}

.rail-tooltip > span {
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
}

@media (min-width: 960px) {
  .style-rail {
    flex-direction: column;
    width: 72px;
  }

  .rail-step svg {
    transform: none;
  }

  .rail-list {
    flex: none;
    flex-direction: column;
    width: 72px;
    height: min(calc(100dvh - 300px), calc(var(--style-count) * 76px));
    min-height: 76px;
    overflow-x: hidden;
    overflow-y: auto;
    overscroll-behavior-y: contain;
  }

  .rail-cycle {
    flex-direction: column;
    padding-right: 0;
    padding-bottom: var(--rail-gap);
  }
}

@media (prefers-reduced-motion: reduce) {
  .rail-item {
    transition: none;
  }
}
</style>
