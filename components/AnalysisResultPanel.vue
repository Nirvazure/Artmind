<template>
  <div class="glass-panel analysis-panel">
    <Transition name="fade-swap">
      <div v-if="viewPhase === 'analyzing'" key="loading" class="glass-content analyzing-wrap">
        <div class="analyzing-ring">
          <div class="analyzing-portrait-wrap">
            <img :src="VINCENT_LOADING_IMAGE_URL" alt="梵高" class="analyzing-portrait" />
          </div>
        </div>
        <p class="analyzing-caption">正在掀起梵高的棺材板</p>
      </div>
      <div v-else-if="result" key="result" class="glass-content">
        <AnalysisHeroLabel
          :styles="result.styles"
          :display-style-name="relatedStyle"
          :raw-labels="result.rawLabels"
          :output-mode="outputMode"
          @update:output-mode="$emit('update:outputMode', $event)"
        />
        <AnalysisHeroPainters
          :painters="result.painters"
          :style-name="relatedStyle"
          :painters-catalog="paintersCatalog"
        />
        <RelatedArtworksStrip
          v-if="relatedStyle"
          variant="panel"
          :current-id="currentArtworkId"
          :style="relatedStyle"
          :artworks="artworkStore.artworks"
        />
        <AnalysisConfirmCard
          :can-save-to-gallery="canSaveToGallery"
          :show-save-to-gallery="showSaveToGallery"
          :show-update-artwork="showUpdateArtwork"
          :updating="updating"
          @open-save-dialog="openArtworkActionDialog"
        />
        <AnalysisSaveDialog
          :model-value="saveDialogOpen"
          :title="title"
          :selected-style="selectedStyle"
          :ai-recommended-style="result.styles[0]?.name ?? ''"
          :editable-painters="editablePainters"
          :style-select-items="styleSelectItems"
          :painters-catalog="paintersCatalog"
          :model-styles-loading="modelStylesLoading"
          :saving="savingToGallery"
          :updating="updating"
          :is-existing-owned="isExistingOwned"
          @update:model-value="emit('update:saveDialogOpen', $event)"
          @confirm="onSaveDialogConfirm"
        />
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

const props = withDefaults(
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
    showSaveToGallery: boolean
    showUpdateArtwork: boolean
    canOpenArtworkActionDialog: boolean
    currentArtworkId?: string
    isExistingOwned?: boolean
    updating?: boolean
    saveDialogOpen?: boolean
  }>(),
  {
    currentArtworkId: '',
    isExistingOwned: false,
    updating: false,
    saveDialogOpen: false,
  },
)

interface SaveDraft {
  title: string
  selectedStyle: string
  editablePainters: string[]
}

const emit = defineEmits<{
  'update:outputMode': [value: 'polished' | 'raw']
  'update:title': [value: string]
  'update:selectedStyle': [value: string]
  'update:editablePainters': [value: string[]]
  'update:saveDialogOpen': [value: boolean]
  saveToGallery: [draft?: SaveDraft]
  updateArtwork: [draft?: SaveDraft]
}>()

function onSaveDialogConfirm(draft: SaveDraft) {
  if (!props.canOpenArtworkActionDialog) return

  if (props.showUpdateArtwork) {
    emit('updateArtwork', draft)
    return
  }

  if (props.showSaveToGallery) {
    emit('saveToGallery', draft)
  }
}

function openArtworkActionDialog() {
  if (!props.canOpenArtworkActionDialog) return
  emit('update:saveDialogOpen', true)
}

interface PainterCatalogItem {
  name: string
  style: string
}

const { data: paintersData } = await useFetch<PainterCatalogItem[]>('/api/painters')
const paintersCatalog = computed(() => paintersData.value ?? [])

const artworkStore = useArtworkStore()

const relatedStyle = computed(() => {
  const trimmed = props.selectedStyle?.trim()
  if (trimmed) return trimmed
  return props.result?.styles[0]?.name?.trim() ?? ''
})

const VINCENT_LOADING_IMAGE_URL = 'https://artmind.oss-cn-hangzhou.aliyuncs.com/vincent.jpg'
</script>

<style scoped>
.analysis-panel.glass-panel {
  padding: 24px;
  width: min(100%, 640px);
  max-height: min(80vh, 680px);
  overflow-y: auto;
  --confirm-surface: rgba(255, 255, 255, 0.08);
  --confirm-border: rgba(255, 255, 255, 0.14);
}

.glass-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.analyzing-wrap {
  align-items: center;
  justify-content: center;
  gap: 20px;
  min-height: 280px;
  padding: 16px 8px;
}

.analyzing-ring {
  position: relative;
  width: 196px;
  height: 196px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.analyzing-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(201, 169, 98, 0.45);
  animation: ring-spin 8s linear infinite;
}

.analyzing-portrait-wrap {
  width: 180px;
  height: 180px;
  border-radius: 50%;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.15);
  box-shadow: 0 12px 28px -16px rgba(0, 0, 0, 0.55);
}

.analyzing-portrait {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  animation: portrait-fade-in 0.28s ease both;
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

.fade-swap-enter-active,
.fade-swap-leave-active {
  transition: opacity 0.28s ease;
}

.fade-swap-enter-from,
.fade-swap-leave-to {
  opacity: 0;
}

@keyframes analyzing-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@keyframes portrait-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (min-width: 600px) and (max-width: 1360px) {
  .analysis-panel.glass-panel {
    width: 100%;
    max-height: calc(100dvh - 152px);
    padding: clamp(16px, 1.7vw, 20px);
    border-radius: 18px;
  }

  .glass-content {
    gap: 0;
  }

  .analyzing-wrap {
    min-height: clamp(260px, 42vh, 420px);
    gap: 16px;
    padding: 10px 4px;
  }

  .analyzing-ring {
    width: clamp(150px, 16vw, 180px);
    height: clamp(150px, 16vw, 180px);
  }

  .analyzing-portrait-wrap {
    width: calc(clamp(150px, 16vw, 180px) - 14px);
    height: calc(clamp(150px, 16vw, 180px) - 14px);
  }
}

@media (min-width: 600px) and (max-width: 839px) {
  .analysis-panel.glass-panel {
    max-height: calc(100dvh - 136px);
    padding: 12px;
    border-radius: 14px;
  }

  .analyzing-wrap {
    min-height: clamp(240px, 38vh, 360px);
  }
}

@media (max-width: 599px) {
  .analysis-panel.glass-panel {
    width: 100%;
    max-width: none;
    max-height: none;
    overflow: visible;
    padding: 14px;
    border-radius: 12px;
    background: rgba(246, 242, 231, 0.9);
    color: #211d17;
    border-color: rgba(255, 255, 255, 0.42);
    box-shadow:
      0 18px 38px -30px rgba(0, 0, 0, 0.58),
      inset 0 1px 0 rgba(255, 255, 255, 0.52);
    --ui-text: #211d17;
    --ui-muted: rgba(33, 29, 23, 0.68);
    --ui-divider: rgba(33, 29, 23, 0.12);
    --confirm-surface: rgba(33, 29, 23, 0.05);
    --confirm-border: rgba(33, 29, 23, 0.12);
  }

  .analysis-panel.glass-panel::before {
    left: 12px;
    right: 12px;
    background: rgba(168, 143, 84, 0.38);
  }

  .glass-content {
    gap: 0;
  }

  .analyzing-wrap {
    min-height: min(720px, calc(100dvh - 120px));
    gap: 24px;
  }

  .analyzing-ring {
    width: min(62vw, 232px);
    height: min(62vw, 232px);
  }

  .analyzing-portrait-wrap {
    width: calc(min(62vw, 232px) - 18px);
    height: calc(min(62vw, 232px) - 18px);
  }

  .analyzing-caption {
    max-width: 260px;
    font-size: 1.05rem;
  }
}
</style>
