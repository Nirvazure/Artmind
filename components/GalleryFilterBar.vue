<template>
  <v-autocomplete
    v-model="selected"
    :items="searchItems"
    placeholder="搜索流派或画家"
    clearable
    hide-details
    :density="props.compact ? 'compact' : 'comfortable'"
    variant="outlined"
    :class="['filter-search', { 'has-filter': hasActiveFilter }]"
    item-title="title"
    item-value="value"
    @update:model-value="onSelect"
  >
    <template #prepend-inner>
      <v-icon icon="mdi-magnify" size="20" class="filter-search-icon" />
    </template>
    <template #item="{ item, props: itemProps }">
      <v-list-item v-bind="itemProps" class="filter-item">
        <template v-if="item.value?.startsWith('s:')">
          <v-avatar
            :image="styleCoverMap[item.value.slice(2)]"
            size="36"
            rounded
            class="filter-item-avatar mr-3"
          >
            <v-icon v-if="!styleCoverMap[item.value.slice(2)]" icon="mdi-palette" size="20" />
          </v-avatar>
          <span>{{ item.title }}</span>
        </template>
        <template v-else-if="item.value?.startsWith('p:')">
          <v-avatar
            :image="avatarUrl(item.value.slice(2))"
            size="36"
            class="filter-item-avatar mr-3"
          />
          <span>{{ item.title }}</span>
        </template>
        <template v-else>
          <span>{{ item.title }}</span>
        </template>
      </v-list-item>
    </template>
  </v-autocomplete>
</template>

<script setup lang="ts">
interface PainterItem {
  name: string
  style: string
}

const props = withDefaults(
  defineProps<{
    styles: string[]
    painters: PainterItem[]
    styleCoverMap?: Record<string, string>
    filterStyle: string | null
    filterPainter: string | null
    compact?: boolean
  }>(),
  { compact: false }
)

const emit = defineEmits<{
  'update:filterStyle': [value: string | null]
  'update:filterPainter': [value: string | null]
}>()

const styleCoverMap = computed(() => props.styleCoverMap ?? {})

const hasActiveFilter = computed(() => !!props.filterStyle || !!props.filterPainter)

const selected = ref<string | null>(null)

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=64`
}

const searchItems = computed(() => {
  const items: Array<{ title: string; value: string }> = []
  for (const s of props.styles) {
    items.push({ title: `流派：${s}`, value: `s:${s}` })
  }
  for (const p of props.painters) {
    items.push({ title: `画家：${p.name}`, value: `p:${p.name}` })
  }
  return items
})

watch(
  () => [props.filterStyle, props.filterPainter],
  () => {
    if (props.filterPainter) {
      selected.value = `p:${props.filterPainter}`
    } else if (props.filterStyle) {
      selected.value = `s:${props.filterStyle}`
    } else {
      selected.value = null
    }
  },
  { immediate: true }
)

function onSelect(val: string | null) {
  if (!val) {
    emit('update:filterStyle', null)
    emit('update:filterPainter', null)
    return
  }
  if (val.startsWith('s:')) {
    emit('update:filterStyle', val.slice(2))
    emit('update:filterPainter', null)
  } else if (val.startsWith('p:')) {
    emit('update:filterPainter', val.slice(2))
    emit('update:filterStyle', null)
  }
}
</script>

<style scoped>
.filter-search {
  width: 100%;
  min-width: 280px;
  max-width: 420px;
}

.filter-search:deep(.v-field) {
  min-height: 48px;
  border-radius: 14px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.filter-search:deep(.v-field):hover,
.filter-search.has-filter:deep(.v-field) {
  border-color: rgba(var(--v-theme-primary), 0.4);
}

.filter-search-icon {
  opacity: 0.6;
}

.filter-item {
  min-height: 48px;
}

.filter-item-avatar {
  flex-shrink: 0;
}
</style>
