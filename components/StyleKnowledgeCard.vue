<template>
  <section class="style-knowledge" aria-label="流派背景知识" :aria-busy="stylesPending">
    <button
      v-if="knowledge"
      type="button"
      class="knowledge-toggle"
      :aria-expanded="expanded"
      :aria-controls="detailsId"
      @click="expanded = !expanded"
    >
      <span class="knowledge-heading">
        <span class="knowledge-eyebrow">流派背景知识</span>
        <span class="knowledge-selected-style">{{ knowledge.name }}</span>
      </span>
      <span class="knowledge-toggle-action">
        {{ expanded ? '收起' : '展开' }}
        <LucideIcon :name="expanded ? 'chevronUp' : 'chevronDown'" :size="16" />
      </span>
    </button>
    <p v-else class="knowledge-eyebrow">流派背景知识</p>
    <p v-if="stylesPending && !knowledge" class="knowledge-status" role="status">
      正在加载流派资料…
    </p>
    <div v-else-if="stylesError && !knowledge" class="knowledge-status" role="status">
      <span>流派资料加载失败</span>
      <v-btn size="small" variant="text" :loading="stylesPending" @click="refreshStyles()"
        >重试</v-btn
      >
    </div>
    <div v-else-if="knowledge && expanded" :id="detailsId">
      <div class="knowledge-title-row">
        <h3>{{ knowledge.name }}</h3>
        <span class="knowledge-english">{{ knowledge.englishName }}</span>
      </div>
      <p class="knowledge-summary">{{ knowledge.summary }}</p>
      <div class="knowledge-details">
        <p class="knowledge-era">大致时期：{{ knowledge.era }}</p>
        <h4>典型特征</h4>
        <ul class="knowledge-characteristics">
          <li v-for="characteristic in knowledge.characteristics" :key="characteristic">
            {{ characteristic }}
          </li>
        </ul>
        <h4>代表画家</h4>
        <div class="knowledge-painters">
          <template v-for="name in knowledge.representativePainters" :key="name">
            <button
              v-if="findPainter(painters, name)"
              type="button"
              class="knowledge-painter"
              @click="openPainter(name)"
            >
              {{ findPainter(painters, name)?.displayName }} ↗
            </button>
            <span v-else>{{ name }}</span>
          </template>
        </div>
        <p v-if="paintersPending" class="knowledge-status" role="status">正在加载画家资料…</p>
        <div v-else-if="paintersError" class="knowledge-status" role="status">
          <span>{{
            painters.length ? '画家资料更新失败，正在显示缓存资料。' : '画家资料加载失败'
          }}</span>
          <v-btn size="small" variant="text" @click="refreshPainters()">重试</v-btn>
        </div>
        <div v-else-if="paintersStale" class="knowledge-status" role="status">
          <span>正在显示缓存的画家资料。</span>
          <v-btn size="small" variant="text" :loading="paintersPending" @click="refreshPainters()"
            >重试</v-btn
          >
        </div>
        <h4>资料来源</h4>
        <ul class="knowledge-sources">
          <li v-for="source in knowledge.sources" :key="source.url">
            <a :href="source.url" target="_blank" rel="noopener noreferrer">{{ source.title }} ↗</a>
            <span>{{ source.institution }}</span>
          </li>
        </ul>
        <p class="knowledge-footnote">
          核验日期：{{ knowledge.verifiedAt }} · 以上为流派共性，具体作品可能不同。
        </p>
      </div>
    </div>
    <p v-else-if="!knowledge" class="knowledge-status">暂未收录“{{ styleName }}”的背景资料。</p>
    <div v-if="knowledge && (stylesStale || stylesError)" class="knowledge-status" role="status">
      <span>{{
        stylesError ? '流派资料更新失败，正在显示缓存资料。' : '正在显示缓存的流派资料。'
      }}</span>
      <v-btn size="small" variant="text" :loading="stylesPending" @click="refreshStyles()"
        >重试</v-btn
      >
    </div>
    <PainterKnowledgeDialog v-model="painterDialogOpen" :painter="selectedPainter" />
  </section>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import { findPainter, findStyleKnowledge } from '~/utils/art-knowledge'
import type { PainterKnowledge } from '~/types/art-knowledge'

const props = defineProps<{ styleName: string }>()
const detailsId = useId()
const {
  styles,
  painters,
  stylesPending,
  stylesError,
  paintersPending,
  paintersError,
  stylesStale,
  paintersStale,
  refreshStyles,
  refreshPainters,
} = useArtKnowledge()
const knowledge = computed(() => findStyleKnowledge(styles.value, props.styleName))
const expanded = ref(false)
const painterDialogOpen = ref(false)
const selectedPainter = ref<PainterKnowledge | null>(null)
watch(
  () => props.styleName,
  () => {
    expanded.value = false
    painterDialogOpen.value = false
    selectedPainter.value = null
  },
)
function openPainter(name: string) {
  selectedPainter.value = findPainter(painters.value, name)
  painterDialogOpen.value = !!selectedPainter.value
}
watch(painters, () => {
  if (!selectedPainter.value) return
  selectedPainter.value = findPainter(painters.value, selectedPainter.value.name)
  if (!selectedPainter.value) painterDialogOpen.value = false
})
</script>

<style scoped>
.style-knowledge {
  padding: 18px 0;
  color: var(--ui-text, var(--gallery-text, inherit));
  border-top: 1px solid var(--ui-divider, var(--gallery-border, rgba(255, 255, 255, 0.12)));
}
.knowledge-eyebrow {
  margin: 0 0 10px;
  font-size: 0.72rem;
  letter-spacing: 0.1em;
  color: var(--ui-muted, var(--gallery-text-secondary, inherit));
}
.knowledge-title-row {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 6px 12px;
}
.knowledge-title-row h3 {
  font-size: 1.05rem;
  font-weight: 600;
}
.knowledge-english {
  font-size: 0.78rem;
  opacity: 0.65;
}
.knowledge-summary {
  margin: 10px 0 8px;
  font-size: 0.88rem;
  line-height: 1.85;
}
.knowledge-toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  width: 100%;
  min-height: 44px;
  text-align: left;
  color: inherit;
  cursor: pointer;
  border-radius: 4px;
}
.knowledge-toggle:focus-visible {
  outline: 2px solid #a88f54;
  outline-offset: 4px;
}
.knowledge-heading,
.knowledge-toggle-action {
  display: flex;
  align-items: center;
  gap: 8px;
}
.knowledge-heading {
  flex-wrap: wrap;
}
.knowledge-toggle .knowledge-eyebrow {
  margin: 0;
}
.knowledge-selected-style {
  font-size: 0.8rem;
}
.knowledge-toggle-action {
  flex-shrink: 0;
  font-size: 0.75rem;
  opacity: 0.7;
}
.knowledge-details {
  margin-top: 12px;
  padding-left: 14px;
  border-left: 2px solid rgba(168, 143, 84, 0.6);
  font-size: 0.83rem;
  line-height: 1.8;
}
.knowledge-details h4 {
  font-size: 0.8rem;
  margin: 16px 0 6px;
  font-weight: 600;
}
.knowledge-era {
  opacity: 0.8;
}
.knowledge-characteristics {
  padding-left: 18px;
  display: grid;
  gap: 4px;
}
.knowledge-painters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 18px;
}
.knowledge-painter {
  color: inherit;
  text-decoration: underline;
  text-underline-offset: 4px;
  cursor: pointer;
  text-align: left;
}
.knowledge-painter:focus-visible {
  outline: 2px solid #a88f54;
  outline-offset: 4px;
  border-radius: 2px;
}
.knowledge-sources {
  list-style: none;
  padding: 0;
  display: grid;
  gap: 10px;
}
.knowledge-sources a {
  color: inherit;
  text-underline-offset: 3px;
  overflow-wrap: anywhere;
}
.knowledge-sources span {
  display: block;
  opacity: 0.65;
  font-size: 0.75rem;
}
.knowledge-footnote {
  margin-top: 14px;
  font-size: 0.72rem;
  opacity: 0.65;
}
.knowledge-status {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 0.8rem;
  line-height: 1.7;
  opacity: 0.8;
}
</style>
