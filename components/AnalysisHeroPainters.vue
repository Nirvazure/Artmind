<template>
  <section
    v-if="displayPainters.length || paintersPending || paintersError"
    class="hero-painters"
    aria-label="流派相关画家"
  >
    <div class="hero-painters-head">
      <p class="hero-painters-eyebrow">流派相关画家</p>
      <p class="hero-painters-disclaimer">按流派目录关联 · 顺序不代表作者概率</p>
    </div>
    <div class="hero-painters-row">
      <component
        :is="painter.record ? 'button' : 'div'"
        v-for="painter in painterItems"
        :key="painter.name"
        :type="painter.record ? 'button' : undefined"
        class="hero-painter-item"
        :class="{ 'hero-painter-item--interactive': painter.record }"
        :aria-label="painter.record ? `查看${painter.record.displayName}的资料` : undefined"
        @click="openPainter(painter.record)"
      >
        <PainterPortrait
          :name="painter.record?.displayName ?? painter.name"
          :portrait-url="painter.record?.portrait?.url"
          :size="44"
        />
        <span class="hero-painter-name">{{ painter.record?.displayName ?? painter.name }}</span>
      </component>
    </div>
    <p v-if="paintersPending && !catalog.length" class="hero-painters-status" role="status">
      正在加载画家资料…
    </p>
    <div v-else-if="paintersError" class="hero-painters-status" role="status">
      <span>{{
        catalog.length
          ? '画家资料更新失败，正在显示缓存资料。'
          : '画家资料加载失败，已保留画家名称。'
      }}</span>
      <v-btn size="small" variant="text" :loading="paintersPending" @click="refreshPainters()"
        >重试</v-btn
      >
    </div>
    <div v-else-if="paintersStale" class="hero-painters-status" role="status">
      <span>正在显示缓存的画家资料。</span>
      <v-btn size="small" variant="text" :loading="paintersPending" @click="refreshPainters()"
        >重试</v-btn
      >
    </div>
    <PainterKnowledgeDialog v-model="painterDialogOpen" :painter="selectedPainter" />
  </section>
</template>

<script setup lang="ts">
import type { PainterCatalogItem } from '~/composables/usePainterDisplay'
import { usePainterDisplay } from '~/composables/usePainterDisplay'
import type { PainterKnowledge } from '~/types/art-knowledge'
import { findPainter } from '~/utils/art-knowledge'

const props = withDefaults(
  defineProps<{
    painters?: string[]
    styleName?: string
    paintersCatalog?: PainterCatalogItem[]
  }>(),
  {
    painters: () => [],
    styleName: '',
    paintersCatalog: () => [],
  },
)
const {
  painters: catalog,
  paintersPending,
  paintersError,
  paintersStale,
  refreshPainters,
} = useArtKnowledge()
const paintersRef = computed(() => props.painters)
const styleNameRef = computed(() => props.styleName)
const catalogRef = computed(() =>
  props.paintersCatalog.length ? props.paintersCatalog : catalog.value,
)
const displayPainters = usePainterDisplay(paintersRef, styleNameRef, catalogRef)
const painterItems = computed(() =>
  displayPainters.value.map((name) => ({ name, record: findPainter(catalog.value, name) })),
)
const painterDialogOpen = ref(false)
const selectedPainter = ref<PainterKnowledge | null>(null)
function openPainter(painter: PainterKnowledge | null) {
  if (!painter) return
  selectedPainter.value = painter
  painterDialogOpen.value = true
}
watch(catalog, () => {
  if (!selectedPainter.value) return
  selectedPainter.value = findPainter(catalog.value, selectedPainter.value.name)
  if (!selectedPainter.value) painterDialogOpen.value = false
})
watch(
  () => props.styleName,
  () => {
    painterDialogOpen.value = false
    selectedPainter.value = null
  },
)
</script>

<style scoped>
.hero-painters {
  padding: 16px 0;
  border-top: 1px solid var(--ui-divider, rgba(255, 255, 255, 0.12));
}
.hero-painters-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 4px 12px;
  margin-bottom: 14px;
}
.hero-painters-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--ui-muted);
}
.hero-painters-disclaimer {
  margin: 0;
  font-size: 0.68rem;
  color: var(--ui-muted);
  opacity: 0.8;
}
.hero-painters-row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: 12px;
}
.hero-painter-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  width: 80px;
  padding: 6px 4px;
  border-radius: 8px;
  color: var(--ui-text, inherit);
}
.hero-painter-item--interactive {
  cursor: pointer;
}
.hero-painter-item--interactive:hover {
  background: var(--confirm-surface, rgba(255, 255, 255, 0.06));
}
.hero-painter-item--interactive:focus-visible {
  outline: 2px solid #a88f54;
  outline-offset: 2px;
}
.hero-painter-name {
  font-size: 0.78rem;
  text-align: center;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.hero-painters-status {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
  font-size: 0.78rem;
  color: var(--ui-muted);
}
@media (max-width: 599px) {
  .hero-painters {
    padding: 14px 0;
  }
  .hero-painters-row {
    gap: 8px;
  }
  .hero-painter-item {
    width: 72px;
  }
}
</style>
