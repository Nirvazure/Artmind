<template>
  <v-sheet class="filter-bar" variant="flat">
    <div class="filter-bar-header" @click="expanded = !expanded">
      <span class="filter-bar-label">筛选</span>
      <v-icon :icon="expanded ? 'mdi-chevron-up' : 'mdi-chevron-down'" size="20" />
    </div>
    <Transition name="filter-expand">
      <div v-show="expanded" class="filter-bar-body">
        <div class="filter-row">
          <span class="filter-row-label">流派</span>
          <div class="filter-style-cards">
            <button
              v-for="s in styles"
              :key="s"
              type="button"
              class="style-pill"
              :class="{ active: modelValueStyle === s, 'has-cover': !!styleCoverMap?.[s] }"
              @click="onStyleClick(s)"
            >
              <span v-if="styleCoverMap?.[s]" class="style-pill-bg" :style="{ backgroundImage: `url(${styleCoverMap[s]})` }" />
              <span v-if="styleCoverMap?.[s]" class="style-pill-overlay" />
              <span class="style-pill-text">{{ s }}</span>
            </button>
          </div>
        </div>
        <div class="filter-row">
          <span class="filter-row-label">画家</span>
          <div class="filter-chips">
            <v-chip
              v-for="p in painters"
              :key="p.name"
              :variant="modelValuePainter === p.name ? 'flat' : 'outlined'"
              size="small"
              :prepend-avatar="avatarUrl(p.name)"
              class="filter-chip"
              @click="onPainterClick(p)"
            >
              {{ p.name }}
            </v-chip>
          </div>
        </div>
      </div>
    </Transition>
  </v-sheet>
</template>

<script setup lang="ts">
interface PainterItem {
  name: string
  style: string
}

const props = defineProps<{
  styles: string[]
  painters: PainterItem[]
  styleCoverMap?: Record<string, string>
  filterStyle: string | null
  filterPainter: string | null
}>()

const styleCoverMap = computed(() => props.styleCoverMap ?? {})

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=64`
}

const emit = defineEmits<{
  'update:filterStyle': [value: string | null]
  'update:filterPainter': [value: string | null]
}>()

const expanded = ref(false)
const modelValueStyle = computed(() => props.filterStyle)
const modelValuePainter = computed(() => props.filterPainter)

function onStyleClick(s: string) {
  const next = props.filterStyle === s ? null : s
  emit('update:filterStyle', next)
  emit('update:filterPainter', null)
}

function onPainterClick(p: PainterItem) {
  const next = props.filterPainter === p.name ? null : p.name
  emit('update:filterPainter', next)
  if (next) emit('update:filterStyle', null)
}
</script>

<style scoped>
.filter-bar {
  padding: 0;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 75%, transparent) !important;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  margin-bottom: 20px;
}

.filter-bar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  cursor: pointer;
  min-height: 44px;
}

.filter-bar-label {
  font-size: 0.8rem;
  font-weight: 500;
  opacity: 0.78;
}

.filter-bar-body {
  padding: 0 14px 12px;
  overflow: hidden;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.filter-row:first-child {
  margin-top: 0;
}

.filter-row-label {
  flex-shrink: 0;
  font-size: 0.75rem;
  opacity: 0.7;
}

.filter-style-cards {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  padding-bottom: 6px;
  flex: 1;
  min-width: 0;
}

.style-pill {
  position: relative;
  flex-shrink: 0;
  min-width: 120px;
  width: 140px;
  aspect-ratio: 8 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 0.9rem;
  font-weight: 500;
  border-radius: 10px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.style-pill:not(.has-cover) {
  background: linear-gradient(135deg, color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, transparent) 0%, color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent) 100%);
}

.style-pill-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.style-pill-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.2) 100%);
  z-index: 1;
}

.style-pill-text {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.style-pill.has-cover:not(.active) .style-pill-text {
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.style-pill.has-cover:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.style-pill.active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.style-pill.active .style-pill-bg,
.style-pill.active .style-pill-overlay {
  display: none;
}

.style-pill.active .style-pill-text {
  color: rgb(var(--v-theme-on-primary));
  text-shadow: none;
}

.filter-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  overflow-x: auto;
  padding-bottom: 4px;
  flex: 1;
  min-width: 0;
}

.filter-chip {
  flex-shrink: 0;
}

.filter-chip :deep(.v-chip__prepend) {
  margin-inline-start: -4px;
}

.filter-chip :deep(.v-avatar) {
  width: 28px !important;
  height: 28px !important;
}

.filter-expand-enter-active,
.filter-expand-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.filter-expand-enter-from,
.filter-expand-leave-to {
  opacity: 0;
}
</style>
