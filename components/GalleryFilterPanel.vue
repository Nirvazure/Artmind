<template>
  <div class="filter-panel gallery-theme-light">
    <div class="filter-header">
      <h2 class="filter-title">探索社区画廊</h2>
      <span class="filter-count">{{ filteredCount }} 幅作品</span>
    </div>

    <div class="filter-toolbar">
      <GalleryStyleTileStrip
        :styles="styles"
        :style-cover-map="styleCoverMap"
        :selected-style="filterStyle"
        :artwork-counts="artworkCounts"
        @update:selected-style="onStyleChange"
      />
      <GalleryPainterSearch
        class="filter-search"
        :painters="painters"
        :selected-painter="filterPainter"
        @update:selected-painter="onPainterChange"
      />
    </div>

    <div v-if="filterStyle || filterPainter" class="filter-chips">
      <button v-if="filterStyle" type="button" class="filter-chip" @click="onStyleChange(null)">
        流派 · {{ filterStyle }}
        <v-icon icon="mdi-close" size="14" />
      </button>
      <button v-if="filterPainter" type="button" class="filter-chip" @click="onPainterChange(null)">
        画家 · {{ filterPainter }}
        <v-icon icon="mdi-close" size="14" />
      </button>
      <button type="button" class="filter-clear" @click="clearAll">清除筛选</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'

interface PainterItem {
  name: string
  style: string
}

const props = defineProps<{
  artworks: Artwork[]
  styles: string[]
  painters: PainterItem[]
  styleCoverMap: Record<string, string>
  filterStyle: string | null
  filterPainter: string | null
  filteredCount: number
}>()

const emit = defineEmits<{
  'update:filterStyle': [value: string | null]
  'update:filterPainter': [value: string | null]
}>()

const artworkCounts = computed(() => {
  const counts: Record<string, number> = {}
  for (const a of props.artworks) {
    if (a.style) counts[a.style] = (counts[a.style] ?? 0) + 1
  }
  return counts
})

function onStyleChange(style: string | null) {
  emit('update:filterStyle', style)
  if (style) emit('update:filterPainter', null)
}

function onPainterChange(painter: string | null) {
  emit('update:filterPainter', painter)
  if (painter) emit('update:filterStyle', null)
}

function clearAll() {
  emit('update:filterStyle', null)
  emit('update:filterPainter', null)
}
</script>

<style scoped>
.filter-panel {
  margin-bottom: 14px;
}

.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 12px;
  gap: 12px;
}

.filter-title {
  margin: 0;
  font-size: clamp(1.15rem, 2.2vw, 1.45rem);
  font-weight: 600;
  color: var(--gallery-text);
}

.filter-count {
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  color: var(--gallery-text-secondary);
  flex-shrink: 0;
}

.filter-toolbar {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.filter-search {
  width: 100%;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
}

.filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--gallery-border);
  background: transparent;
  font-size: 0.82rem;
  color: var(--gallery-text);
  cursor: pointer;
  font-family: inherit;
}

.filter-chip:hover {
  background: var(--gallery-surface);
}

.filter-clear {
  background: none;
  border: none;
  padding: 4px 8px;
  font-size: 0.8rem;
  color: var(--gallery-accent);
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
  font-family: inherit;
}

@media (min-width: 960px) {
  .filter-toolbar {
    flex-direction: row;
    align-items: center;
    gap: 12px;
  }

  .filter-toolbar :deep(.style-tile-strip) {
    flex: 0 1 690px;
    min-width: 0;
    max-width: 690px;
  }

  .filter-search {
    width: 240px;
    max-width: 240px;
    flex: none;
    margin-left: auto;
  }

  .filter-search :deep(.v-field) {
    min-height: 38px;
  }
}

@media (max-width: 599px) {
  .filter-header {
    flex-wrap: wrap;
  }

  .filter-search {
    max-width: none;
  }

  .filter-search :deep(.v-field) {
    min-height: 36px;
  }
}
</style>
