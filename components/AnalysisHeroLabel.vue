<template>
  <div class="hero-label">
    <div class="hero-top">
      <span class="hero-eyebrow">ArtMind Analysis</span>
      <v-btn-toggle
        v-if="hasRawLabels"
        :model-value="outputMode"
        mandatory
        density="compact"
        divided
        color="transparent"
        base-color="transparent"
        class="hero-mode-toggle"
        @update:model-value="$emit('update:outputMode', $event as 'polished' | 'raw')"
      >
        <v-btn value="polished" size="small" class="hero-mode-toggle-btn">
          <v-icon icon="mdi-text-box-outline" size="16" start />
          润色
        </v-btn>
        <v-btn value="raw" size="small" class="hero-mode-toggle-btn">
          <v-icon icon="mdi-code-braces" size="16" start />
          原始
        </v-btn>
      </v-btn-toggle>
    </div>

    <div class="hero-swap">
      <Transition name="hero-view-swap" mode="out-in">
        <div v-if="outputMode === 'polished'" key="polished" class="hero-body">
          <div class="hero-title-row">
            <h2 class="hero-zh">{{ topStyle.name }}</h2>
            <p v-if="englishName" class="hero-en">{{ englishName }}</p>
            <span class="hero-confidence">{{ confidencePct }}%</span>
          </div>
          <div class="hero-bar-track">
            <div class="hero-bar-fill" :style="{ width: `${confidencePct}%` }" />
          </div>
          <p v-if="secondaryLine" class="hero-secondary">{{ secondaryLine }}</p>
        </div>

        <div v-else key="raw" class="hero-raw">
          <div class="hero-raw-list">
            <div v-for="(r, i) in (rawLabels ?? []).slice(0, 5)" :key="i" class="hero-raw-item">
              <span class="hero-raw-name">{{ formatKeremberkeLabel(r.label) }}</span>
              <span class="hero-raw-score">{{ (r.score * 100).toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatKeremberkeLabel, getEnglishStyleName } from '~/utils/style-labels'

const props = withDefaults(
  defineProps<{
    styles: { name: string; confidence: number }[]
    rawLabels?: Array<{ label: string; score: number }>
    outputMode: 'polished' | 'raw'
  }>(),
  {
    rawLabels: undefined,
  },
)

defineEmits<{
  'update:outputMode': [value: 'polished' | 'raw']
}>()

const topStyle = computed(() => props.styles[0] ?? { name: '—', confidence: 0 })

const confidencePct = computed(() => Math.round(topStyle.value.confidence * 100))

const englishName = computed(() => getEnglishStyleName(topStyle.value.name, props.rawLabels))

const secondaryLine = computed(() => {
  const rest = props.styles.slice(1, 3)
  if (rest.length === 0) return ''
  return `次选  ${rest.map((s) => `${s.name} ${(s.confidence * 100).toFixed(0)}%`).join('  ·  ')}`
})

const hasRawLabels = computed(() => (props.rawLabels?.length ?? 0) > 0)
</script>

<style scoped>
.hero-label {
  padding-bottom: 4px;
}

.hero-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
}

.hero-eyebrow {
  font-size: 0.68rem;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.hero-mode-toggle {
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.06);
  height: 32px;
}

.hero-mode-toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.02em;
  font-size: 0.72rem;
  color: #f4f7fb;
  background: rgba(255, 255, 255, 0.08) !important;
  min-width: 0;
  height: 32px !important;
  padding-inline: 10px !important;
  border-radius: 0 !important;
}

.hero-mode-toggle :deep(.v-btn .v-icon) {
  color: inherit;
}

.hero-mode-toggle :deep(.v-btn:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.14) !important;
}

.hero-mode-toggle :deep(.v-btn--active) {
  background: rgba(201, 169, 98, 0.28) !important;
  color: #f4f7fb !important;
}

.hero-mode-toggle :deep(.v-btn--active .v-icon) {
  color: #f4f7fb;
}

.hero-mode-toggle :deep(.v-divider) {
  border-color: rgba(255, 255, 255, 0.12);
}

.hero-swap {
  min-height: 132px;
}

.hero-body,
.hero-raw {
  min-height: 132px;
}

.hero-title-row {
  display: flex;
  align-items: baseline;
  gap: 10px 14px;
  min-width: 0;
  animation: hero-in 0.4s ease-out both;
}

.hero-zh {
  margin: 0;
  font-size: clamp(1.85rem, 5vw, 2.75rem);
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
}

.hero-en {
  margin: 0;
  flex: 1;
  min-width: 0;
  font-size: clamp(0.9rem, 2.2vw, 1.05rem);
  font-style: italic;
  color: rgba(244, 247, 251, 0.55);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-confidence {
  margin-left: auto;
  font-size: clamp(1.35rem, 3.5vw, 1.85rem);
  font-weight: 600;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.hero-bar-track {
  margin-top: 14px;
  height: 3px;
  background: rgba(255, 255, 255, 0.12);
  border-radius: 2px;
  overflow: hidden;
  animation: hero-in 0.4s ease-out 0.08s both;
}

.hero-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #c9a962, #e8d5a3);
  border-radius: 2px;
  animation: bar-grow 0.6s ease-out 0.16s both;
  transform-origin: left center;
}

.hero-secondary {
  margin: 12px 0 0;
  font-size: 0.82rem;
  color: var(--ui-muted);
  animation: hero-in 0.4s ease-out 0.12s both;
}

.hero-raw-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding-top: 2px;
}

.hero-raw-item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
  font-size: 0.88rem;
  min-height: 22px;
}

.hero-raw-name {
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.82rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hero-raw-score {
  color: var(--ui-muted);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.hero-view-swap-enter-active,
.hero-view-swap-leave-active {
  transition: opacity 0.22s ease;
}

.hero-view-swap-enter-from,
.hero-view-swap-leave-to {
  opacity: 0;
}

@keyframes hero-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bar-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 599px) {
  .hero-title-row {
    flex-wrap: wrap;
  }

  .hero-en {
    flex: 1 1 100%;
    order: 3;
  }

  .hero-confidence {
    margin-left: 0;
  }
}
</style>
