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
  </div>
</template>

<script setup lang="ts">
import type { GalleryScope } from '~/utils/gallery-filters'

defineProps<{
  scope: GalleryScope
  onlyCollected: boolean
  loading: boolean
  filteredCount: number
}>()

const emit = defineEmits<{
  'update:scope': [value: GalleryScope]
  'update:onlyCollected': [value: boolean]
}>()

function onScopeChange(value: unknown) {
  if (value === 'community') emit('update:scope', 'community')
  else if (value === 'collection') emit('update:onlyCollected', true)
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

@media (max-width: 599px) {
  .filter-count {
    font-size: 0.8rem;
  }
}
</style>
