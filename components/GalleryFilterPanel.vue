<template>
  <div class="filter-panel gallery-theme-light">
    <div class="filter-header">
      <v-btn-toggle
        :model-value="onlyCollected ? 'collection' : scope === 'community' ? 'community' : null"
        rounded="pill"
        class="filter-scope"
        aria-label="画廊范围"
        @update:model-value="onScopeChange"
      >
        <v-btn
          value="community"
          rounded="pill"
          :aria-pressed="scope === 'community' && !onlyCollected"
        >
          <LucideIcon name="layoutGrid" :size="17" />
          社区
        </v-btn>
        <v-btn value="collection" rounded="pill" :aria-pressed="onlyCollected">
          <LucideIcon name="bookmark" :size="17" :fill="onlyCollected ? 'currentColor' : 'none'" />
          收藏
        </v-btn>
      </v-btn-toggle>
      <span class="filter-count">{{ loading ? '加载中…' : `${filteredCount} 幅作品` }}</span>
    </div>

    <div v-if="filterStyle" class="filter-chips">
      <button v-if="filterStyle" type="button" class="filter-chip" @click="onStyleChange(null)">
        流派 · {{ filterStyle }}
        <v-icon icon="mdi-close" size="14" />
      </button>
      <button type="button" class="filter-clear" @click="clearAll">清除筛选</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { GalleryScope } from '~/utils/gallery-filters'

defineProps<{
  scope: GalleryScope
  onlyCollected: boolean
  loading: boolean
  filterStyle: string | null
  filteredCount: number
}>()

const emit = defineEmits<{
  'update:scope': [value: GalleryScope]
  'update:onlyCollected': [value: boolean]
  'update:filterStyle': [value: string | null]
}>()

function onScopeChange(value: unknown) {
  if (value === 'community') emit('update:scope', 'community')
  else if (value === 'collection') emit('update:onlyCollected', true)
}

function onStyleChange(style: string | null) {
  emit('update:filterStyle', style)
}

function clearAll() {
  emit('update:filterStyle', null)
}
</script>

<style scoped>
.filter-panel {
  margin-bottom: 14px;
}

.filter-header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  margin-bottom: 12px;
  gap: 16px;
}

.filter-scope.v-btn-group {
  height: 42px;
  padding: 3px;
  background: var(--gallery-surface);
  border: 1px solid var(--gallery-border);
}

.filter-scope :deep(.v-btn) {
  min-width: 88px;
  border-radius: 999px;
  background: transparent;
  color: var(--gallery-text-secondary);
}

.filter-scope :deep(.v-btn--active) {
  background: var(--gallery-accent);
  color: var(--gallery-accent-foreground);
}

.filter-scope :deep(.v-btn__content) {
  gap: 7px;
}

.filter-count {
  margin-left: auto;
  font-size: 0.88rem;
  font-variant-numeric: tabular-nums;
  color: var(--gallery-text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
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

@media (max-width: 599px) {
  .filter-count {
    font-size: 0.8rem;
  }
}
</style>
