<template>
  <div class="glass-panel analysis-panel">
    <Transition name="fade-swap">
      <div v-if="viewPhase === 'analyzing'" key="loading" class="glass-content analyzing-wrap">
        <div class="analyzing-ring">
          <div class="analyzing-portrait-wrap">
            <v-img :src="VINCENT_LOADING_IMAGE_URL" alt="梵高" cover class="analyzing-portrait" />
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
          v-model="saveDialogOpen"
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
  }>(),
  {
    currentArtworkId: '',
    isExistingOwned: false,
    updating: false,
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
  saveToGallery: [draft?: SaveDraft]
  updateArtwork: [draft?: SaveDraft]
}>()

const saveDialogOpen = ref(false)

watch(
  () => props.updating,
  (val, oldVal) => {
    if (oldVal && !val) saveDialogOpen.value = false
  },
)

function onSaveDialogConfirm(draft: SaveDraft) {
  if (!props.canOpenArtworkActionDialog) return

  emit('update:title', draft.title)
  emit('update:selectedStyle', draft.selectedStyle)
  emit('update:editablePainters', draft.editablePainters)

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
  saveDialogOpen.value = true
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

.fade-swap-enter-active,
.fade-swap-leave-active {
  transition:
    opacity 0.28s ease,
    transform 0.28s ease;
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

@keyframes ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 599px) {
  .analysis-panel.glass-panel {
    width: 100%;
    max-width: none;
    padding: 18px;
  }

  .analyzing-wrap {
    min-height: 220px;
  }

  .analyzing-ring {
    width: 156px;
    height: 156px;
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
