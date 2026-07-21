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
            <h2 class="hero-zh">{{ displayStyleName }}</h2>
            <p v-if="englishName" class="hero-en">{{ englishName }}</p>
            <span v-if="confidencePct !== null" class="hero-confidence">{{ confidencePct }}%</span>
          </div>
          <div v-if="confidencePct !== null" class="hero-bar-track">
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
    displayStyleName?: string
    rawLabels?: Array<{ label: string; score: number }>
    outputMode: 'polished' | 'raw'
  }>(),
  {
    displayStyleName: '',
    rawLabels: undefined,
  },
)

defineEmits<{
  'update:outputMode': [value: 'polished' | 'raw']
}>()

const topStyle = computed(() => props.styles[0] ?? { name: '—', confidence: 0 })
const displayStyleName = computed(() => props.displayStyleName.trim() || topStyle.value.name)
const isDisplayStyleOverridden = computed(
  () => !!displayStyleName.value && displayStyleName.value !== topStyle.value.name,
)

const confidencePct = computed(() =>
  isDisplayStyleOverridden.value ? null : Math.round(topStyle.value.confidence * 100),
)

const englishName = computed(() =>
  getEnglishStyleName(
    displayStyleName.value,
    isDisplayStyleOverridden.value ? undefined : props.rawLabels,
  ),
)

const secondaryLine = computed(() => {
  if (isDisplayStyleOverridden.value) {
    const topName = topStyle.value.name.trim()
    if (!topName) return ''
    const aiConfidence = Math.round(topStyle.value.confidence * 100)
    return aiConfidence > 0 ? `AI 推荐：${topName} ${aiConfidence}%` : `AI 推荐：${topName}`
  }

  const rest = props.styles.slice(1, 3)
  if (rest.length === 0) return ''
  return `次选 ${rest.map((s) => `${s.name} ${(s.confidence * 100).toFixed(0)}%`).join('  ·  ')}`
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
  position: relative;
  z-index: 1;
  border: 1px solid rgba(255, 255, 255, 0.78);
  border-radius: 10px;
  overflow: hidden;
  background: rgba(244, 241, 232, 0.92);
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.7),
    0 10px 24px -18px rgba(0, 0, 0, 0.62);
  height: 36px;
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.hero-mode-toggle :deep(.v-btn) {
  text-transform: none;
  letter-spacing: 0.02em;
  font-size: 0.78rem;
  font-weight: 700;
  color: rgba(32, 29, 24, 0.86);
  background: transparent !important;
  min-width: 0;
  height: 36px !important;
  padding-inline: 12px !important;
  border-radius: 0 !important;
  text-shadow: none;
}

.hero-mode-toggle :deep(.v-btn .v-icon) {
  color: inherit;
}

.hero-mode-toggle :deep(.v-btn:hover) {
  color: rgba(24, 22, 18, 0.96);
  background: rgba(201, 169, 98, 0.16) !important;
}

.hero-mode-toggle :deep(.v-btn--active) {
  background: linear-gradient(180deg, #d6bd79, #a88f54) !important;
  color: #17130e !important;
  box-shadow:
    inset 0 1px 0 rgba(255, 246, 218, 0.56),
    0 8px 16px -12px rgba(0, 0, 0, 0.52);
}

.hero-mode-toggle :deep(.v-btn--active .v-icon) {
  color: #17130e;
}

.hero-mode-toggle :deep(.v-divider) {
  border-color: rgba(40, 34, 24, 0.2);
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

@keyframes bar-grow {
  from {
    transform: scaleX(0);
  }
  to {
    transform: scaleX(1);
  }
}

@media (max-width: 599px) {
  .hero-label {
    position: relative;
    padding: 0 0 14px;
    border-bottom: 1px solid var(--ui-divider, rgba(33, 29, 23, 0.12));
  }

  .hero-label::before {
    content: '';
    position: absolute;
    left: -14px;
    top: 4px;
    bottom: 16px;
    width: 3px;
    border-radius: 99px;
    background: linear-gradient(180deg, #a88f54, rgba(168, 143, 84, 0.16));
  }

  .hero-top {
    align-items: flex-start;
    gap: 12px;
    margin-bottom: 12px;
  }

  .hero-eyebrow {
    padding-top: 4px;
    font-size: 0.64rem;
    font-weight: 700;
    letter-spacing: 0.22em;
    color: rgba(33, 29, 23, 0.58);
  }

  .hero-mode-toggle {
    height: 38px;
    border-radius: 12px;
  }

  .hero-mode-toggle :deep(.v-btn) {
    height: 38px !important;
    min-width: 74px;
    font-size: 0.82rem;
  }

  .hero-swap,
  .hero-body,
  .hero-raw {
    min-height: 0;
  }

  .hero-raw-list {
    gap: 8px;
  }

  .hero-raw-item {
    padding: 8px 0;
    border-bottom: 1px solid var(--ui-divider, rgba(33, 29, 23, 0.12));
  }

  .hero-raw-item:last-child {
    border-bottom: 0;
  }

  .hero-title-row {
    flex-wrap: wrap;
    gap: 8px 12px;
  }

  .hero-zh {
    font-size: 2.22rem;
    letter-spacing: 0;
  }

  .hero-en {
    flex: 1 1 100%;
    order: 3;
    font-size: 0.95rem;
  }

  .hero-confidence {
    margin-left: 0;
    font-size: 1.55rem;
  }

  .hero-bar-track {
    margin-top: 12px;
    background: rgba(33, 29, 23, 0.1);
  }

  .hero-secondary {
    margin-top: 10px;
    font-size: 0.86rem;
  }
}
</style>
