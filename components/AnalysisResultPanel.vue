<template>
  <div class="glass-panel">
    <Transition name="fade-swap" mode="out-in">
      <div v-if="viewPhase === 'analyzing'" key="loading" class="glass-content analyzing-wrap">
        <div class="analyzing-portrait-wrap">
          <v-img :src="VINCENT_LOADING_IMAGE_URL" alt="梵高" cover class="analyzing-portrait" />
        </div>
        <p class="analyzing-caption">正在掀起梵高的棺材板</p>
      </div>
      <div v-else-if="result" key="result" class="glass-content">
        <div class="glass-section glass-section-output">
          <div class="glass-section-header">
            <h3 class="glass-title">流派推测</h3>
            <div v-if="result.rawLabels?.length" class="output-mode-toggle">
              <v-btn
                :variant="outputMode === 'polished' ? 'flat' : 'text'"
                icon="mdi-translate"
                size="small"
                density="compact"
                class="output-mode-btn"
                title="润色输出"
                @click="$emit('update:outputMode', 'polished')"
              />
              <v-btn
                :variant="outputMode === 'raw' ? 'flat' : 'text'"
                icon="mdi-code-tags"
                size="small"
                density="compact"
                class="output-mode-btn"
                title="原始输出"
                @click="$emit('update:outputMode', 'raw')"
              />
            </div>
          </div>
          <div v-show="outputMode === 'polished'" class="glass-chart-row">
            <StyleRingChart :styles="result.styles" />
            <div class="style-labels">
              <div v-for="(s, i) in result.styles.slice(0, 3)" :key="i" class="style-label">
                <span class="style-name">{{ s.name }}</span>
                <span class="style-pct">{{ (s.confidence * 100).toFixed(0) }}%</span>
              </div>
            </div>
          </div>
          <div
            v-show="outputMode === 'raw' && (result.rawLabels?.length ?? 0) > 0"
            class="raw-labels mt-2"
          >
            <p class="raw-labels-title">模型原始输出</p>
            <div class="raw-labels-list">
              <div
                v-for="(r, i) in (result.rawLabels ?? []).slice(0, 5)"
                :key="i"
                class="raw-label-item"
              >
                <span class="raw-label-name">{{ r.label }}</span>
                <span class="raw-label-score">{{ (r.score * 100).toFixed(1) }}%</span>
              </div>
            </div>
          </div>
        </div>
        <PainterCards :painters="result.painters" />
        <div class="glass-actions">
          <v-text-field
            :model-value="title"
            label="作品标题"
            variant="outlined"
            density="compact"
            hide-details
            class="glass-field"
            bg-color="rgba(255,255,255,0.1)"
            @update:model-value="$emit('update:title', $event)"
          />
          <v-autocomplete
            :model-value="selectedStyle"
            :items="styleSelectItems"
            item-title="title"
            item-value="value"
            label="真实流派（搜索）"
            variant="outlined"
            density="compact"
            hide-details
            class="glass-field"
            :loading="modelStylesLoading"
            bg-color="rgba(255,255,255,0.1)"
            @update:model-value="$emit('update:selectedStyle', $event)"
          />
          <v-combobox
            :model-value="editablePainters"
            :items="result.painters"
            label="真实画家（可新增/删除）"
            variant="outlined"
            density="compact"
            hide-details
            class="glass-field"
            chips
            closable-chips
            multiple
            clearable
            bg-color="rgba(255,255,255,0.1)"
            @update:model-value="$emit('update:editablePainters', $event)"
          />
          <v-btn
            color="primary"
            size="small"
            :loading="savingToGallery"
            :disabled="!canSaveToGallery"
            @click="$emit('saveToGallery')"
          >
            {{ savingToGallery ? '保存中...' : '保存到画廊' }}
          </v-btn>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
interface AnalysisResult {
  styles: { name: string; confidence: number }[]
  painters: string[]
  rawLabels?: Array<{ label: string; score: number }>
  imageUrl?: string
}

defineProps<{
  viewPhase: 'analyzing' | 'resolved'
  result: AnalysisResult | null
  outputMode: 'polished' | 'raw'
  title: string
  selectedStyle: string
  editablePainters: string[]
  styleSelectItems: { title: string; value: string }[]
  modelStylesLoading: boolean
  savingToGallery: boolean
  canSaveToGallery: boolean
}>()

defineEmits<{
  'update:outputMode': [value: 'polished' | 'raw']
  'update:title': [value: string]
  'update:selectedStyle': [value: string]
  'update:editablePainters': [value: string[]]
  saveToGallery: []
}>()

const VINCENT_LOADING_IMAGE_URL = 'https://artmind.oss-cn-hangzhou.aliyuncs.com/vincent.jpg'
</script>

<style scoped>
.glass-panel {
  background: var(--ui-panel-bg);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 1px solid var(--ui-panel-border);
  border-radius: 16px;
  padding: 24px;
  width: min(100%, 640px);
  max-height: min(80vh, 680px);
  overflow-y: auto;
  color: var(--ui-text);
  box-shadow: 0 20px 34px -24px rgba(0, 0, 0, 0.68);
}

.glass-content {
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.glass-section-output {
  display: flex;
  flex-direction: column;
}

.glass-section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.glass-section-header .glass-title {
  margin: 0;
}

.glass-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 10px;
}

.glass-chart-row {
  display: flex;
  align-items: center;
  gap: 20px;
}

.style-labels {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.style-label {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  font-size: 0.85rem;
}

.style-name {
  font-weight: 500;
}

.style-pct {
  color: var(--ui-muted);
}

.raw-labels {
  padding: 10px 12px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.raw-labels-title {
  margin: 0 0 8px;
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--ui-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.raw-labels-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.raw-label-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.9);
}

.raw-label-name {
  font-family: 'JetBrains Mono', monospace;
}

.raw-label-score {
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
}

.glass-content .glass-section {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ui-divider);
}

.glass-content .glass-section:last-of-type {
  border-bottom: 0;
  padding-bottom: 0;
}

.analyzing-wrap {
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 280px;
  padding: 16px 8px;
}

.analyzing-portrait-wrap {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.55);
  animation: vangogh-float 3s ease-in-out infinite;
}

.analyzing-portrait {
  width: 100%;
  height: 100%;
}

.analyzing-caption {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 600;
  text-align: center;
  letter-spacing: 0.02em;
  color: transparent;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.55) 0%,
    rgba(255, 255, 255, 0.95) 50%,
    rgba(255, 255, 255, 0.55) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: analyzing-shimmer 2s linear infinite;
}

.output-mode-toggle {
  display: flex;
  gap: 4px;
}

.output-mode-btn {
  min-width: 32px !important;
  min-height: 32px !important;
}

.glass-actions {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 10px;
}

.glass-actions .glass-field {
  width: 100%;
  margin-bottom: 0;
}

.glass-actions :deep(.v-field) {
  border-radius: 10px;
}

.glass-actions :deep(.v-chip) {
  margin-inline-end: 4px;
}

.fade-swap-enter-active,
.fade-swap-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.fade-swap-enter-from,
.fade-swap-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes vangogh-float {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-6px);
  }
}

@keyframes analyzing-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 599px) {
  .glass-panel {
    width: 100%;
    max-width: none;
  }

  .analyzing-wrap {
    min-height: 220px;
  }

  .analyzing-portrait-wrap {
    width: 140px;
    height: 140px;
  }

  .analyzing-caption {
    font-size: 0.95rem;
  }
}
</style>
