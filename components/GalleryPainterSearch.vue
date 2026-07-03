<template>
  <div class="painter-search">
    <v-autocomplete
      v-model="query"
      :items="searchItems"
      placeholder="搜索画家…"
      clearable
      hide-details
      density="compact"
      variant="solo-filled"
      flat
      rounded="pill"
      class="search-field"
      item-title="title"
      item-value="value"
      @update:model-value="onSelect"
    >
      <template #prepend-inner>
        <v-icon icon="mdi-magnify" size="20" class="search-icon" />
      </template>
      <template #item="{ item, props: itemProps }">
        <v-list-item v-bind="itemProps" class="search-item">
          <template #prepend>
            <v-avatar :image="avatarUrl(String(item.value))" size="32" class="mr-2" />
          </template>
        </v-list-item>
      </template>
    </v-autocomplete>
  </div>
</template>

<script setup lang="ts">
interface PainterItem {
  name: string
  style: string
}

const props = defineProps<{
  painters: PainterItem[]
  selectedPainter: string | null
}>()

const emit = defineEmits<{
  'update:selectedPainter': [value: string | null]
}>()

const query = ref<string | null>(null)

const searchItems = computed(() =>
  props.painters.map((p) => ({
    title: p.name,
    value: p.name,
    name: p.name,
    style: p.style,
  })),
)

watch(
  () => props.selectedPainter,
  (name) => {
    query.value = name
  },
  { immediate: true },
)

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=64`
}

function onSelect(val: string | null) {
  emit('update:selectedPainter', val)
  if (val) query.value = null
}
</script>

<style scoped>
.painter-search {
  flex: 1;
  min-width: 0;
  max-width: 360px;
}

.search-field :deep(.v-field) {
  background: var(--gallery-surface, rgba(92, 80, 70, 0.06)) !important;
  border: 1px solid var(--gallery-border, rgba(46, 44, 42, 0.12));
  font-size: 0.9rem;
}

.search-field :deep(.v-field__overlay) {
  opacity: 0;
}

.search-icon {
  opacity: 0.55;
}

.search-item {
  min-height: 52px;
}
</style>
