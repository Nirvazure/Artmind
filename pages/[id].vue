<template>
  <div class="page">
    <div class="page-inner">
      <div
        class="page-bg-shadow"
        :style="displayImageSrc ? { backgroundImage: `url(${displayImageSrc})` } : { backgroundColor: 'rgba(30, 28, 26, 0.4)' }"
      />
      <div
        class="page-bg-blur"
        :style="displayImageSrc ? { backgroundImage: `url(${displayImageSrc})` } : { backgroundColor: 'rgba(40, 38, 36, 0.5)' }"
      />
      <div class="page-bg-overlay" />

      <main class="page-main" :class="`phase-${viewPhase}`">
        <div class="content-shell">
          <section class="art-stage">
            <div ref="frameRef" class="frame-container" :style="{ aspectRatio: frameAspectRatio }">
              <div class="frame-inner">
                <v-img
                  v-if="displayImageSrc"
                  :src="displayImageSrc"
                  contain
                  eager
                  class="frame-img"
                />
                <div v-else class="frame-skeleton" />
              </div>
            </div>
            <div class="glass-tools">
              <div class="controls-row">
                <div class="controls-actions-group">
                  <v-btn
                    variant="outlined"
                    rounded="pill"
                    class="upload-btn"
                    prepend-icon="mdi-cloud-upload"
                    size="small"
                    :disabled="loading"
                    @click="triggerUpload"
                  >
                    上传
                  </v-btn>
                  <v-spacer />
                  <v-btn
                    color="primary"
                    variant="flat"
                    rounded="lg"
                    :loading="loading"
                    :disabled="loading || !canAnalyze"
                    prepend-icon="mdi-magnify"
                    size="default"
                    class="analyze-btn analyze-btn--d"
                    @click="analyze"
                  >
                    {{ loading ? '分析中' : '分析' }}
                  </v-btn>
                </div>
              </div>
            </div>
            <v-alert v-if="error" type="error" closable density="compact" class="mt-2">
              {{ error }}
            </v-alert>
            <div v-if="notFound" class="mt-2 d-flex ga-2">
              <v-btn variant="text" color="primary" :to="'/gallery'">去画廊</v-btn>
              <v-btn variant="text" color="primary" :to="'/'">随机一张</v-btn>
            </div>
          </section>

          <section
            v-if="viewPhase !== 'idle'"
            class="result-side"
          >
            <AnalysisResultPanel
              v-model:output-mode="outputMode"
              v-model:title="title"
              v-model:selected-style="selectedStyle"
              v-model:editable-painters="editablePainters"
              :view-phase="viewPhase"
              :result="result"
              :style-select-items="styleSelectItems"
              :model-styles-loading="modelStylesLoading"
              :saving-to-gallery="savingToGallery"
              :can-save-to-gallery="canSaveToGallery"
              @save-to-gallery="saveToGallery"
            />
          </section>
        </div>
      </main>
      <v-btn
        class="switch-artwork-fab"
        variant="elevated"
        color="primary"
        rounded="lg"
        size="default"
        prepend-icon="mdi-shuffle-variant"
        :disabled="loading || !canSwitch"
        @click="switchToRandom"
      >
        换一张
      </v-btn>
      <input
        ref="fileInput"
        type="file"
        accept="image/*"
        class="d-none"
        @change="onFileSelected"
      >
    </div>
  </div>
</template>

<script setup lang="ts">
import VanillaTilt from 'vanilla-tilt'

definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const analyzeMode = computed(() => route.query.analyse === 'true')

const artworkStore = useArtworkStore()
const { classifyByUrl, classifyByFile } = useClassifier()

const artwork = ref<import('~/stores/artwork').Artwork | null>(null)
const loading = ref(false)
const error = ref('')
const notFound = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const pendingFile = ref<File | null>(null)
const uploadedImageUrl = ref<string | null>(null)
const manualResult = ref<{
  styles: { name: string; confidence: number }[]
  painters: string[]
  imageUrl: string
  rawLabels?: Array<{ label: string; score: number }>
} | null>(null)
const title = ref('')
const selectedStyle = ref('')
const editablePainters = ref<string[]>([])
const modelStyles = ref<string[]>([])
const modelStylesLoaded = ref(false)
const modelStylesLoading = ref(false)
const inFlightAnalyzeKey = ref<string | null>(null)
const savingToGallery = ref(false)
const outputMode = ref<'polished' | 'raw'>('polished')

const result = computed(() => {
  if (pendingFile.value && !manualResult.value) return null
  if (manualResult.value) return manualResult.value
  if (!analyzeMode.value) return null
  const a = artwork.value
  if (!a?.analysisResult) return null
  return {
    ...a.analysisResult,
    imageUrl: a.imageUrl,
  }
})

const displayImageSrc = computed(() => {
  if (uploadedImageUrl.value) return uploadedImageUrl.value
  if (manualResult.value?.imageUrl) return encodeUrl(manualResult.value.imageUrl)
  const a = artwork.value
  return a?.imageUrl ? encodeUrl(a.imageUrl) : ''
})

const viewPhase = computed<'idle' | 'analyzing' | 'resolved'>(() => {
  if (loading.value) return 'analyzing'
  if (result.value) return 'resolved'
  if (!analyzeMode.value) return 'idle'
  return 'idle'
})

const frameAspectRatio = computed(() => {
  const a = artwork.value
  if (
    !uploadedImageUrl.value &&
    !manualResult.value &&
    a?.imageWidth &&
    a?.imageHeight &&
    a.imageWidth > 0 &&
    a.imageHeight > 0
  ) {
    return a.imageWidth / a.imageHeight
  }
  return 4 / 3
})

const canSwitch = computed(() => artworkStore.artworks.length > 1)
const canAnalyze = computed(() => !!pendingFile.value || !!artwork.value?.imageUrl)
const canSaveToGallery = computed(() => !!result.value && !loading.value && !savingToGallery.value)
const aiTopStyle = computed(() => result.value?.styles[0]?.name?.trim() ?? '')
const styleSelectItems = computed(() => {
  const items: Array<{ title: string; value: string }> = []
  const seen = new Set<string>()
  const topStyle = aiTopStyle.value
  if (topStyle) {
    items.push({ title: `AI 推荐：${topStyle}`, value: topStyle })
    seen.add(topStyle.toLowerCase())
  }
  for (const style of modelStyles.value) {
    const name = style.trim()
    if (!name) continue
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    items.push({ title: name, value: name })
    seen.add(key)
  }
  return items
})

function normalizePaintersInput(values: string[]): string[] {
  const normalized: string[] = []
  const seen = new Set<string>()
  for (const value of values) {
    const item = value.trim()
    if (!item) continue
    const key = item.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push(item)
  }
  return normalized
}

function syncEditableFromResult() {
  const r = result.value
  if (!r) return
  const a = artwork.value
  title.value = (a?.title || r.styles[0]?.name || '').trim()
  selectedStyle.value = (a?.style || r.styles[0]?.name || '').trim()
  editablePainters.value = normalizePaintersInput(r.painters).slice(0, 3)
}

async function loadModelStyles() {
  if (modelStylesLoaded.value || modelStylesLoading.value) return
  modelStylesLoading.value = true
  try {
    const styles = await $fetch<string[]>('/api/models')
    modelStyles.value = Array.isArray(styles) ? styles : []
    modelStylesLoaded.value = true
  } catch {
    modelStyles.value = []
  } finally {
    modelStylesLoading.value = false
  }
}

function encodeUrl(url: string) {
  if (!url || url.startsWith('http') || url.startsWith('blob:')) return url
  try {
    return encodeURI(url)
  } catch {
    return url
  }
}

function pickRandomOtherId(currentId: string): string | null {
  const list = artworkStore.artworks.filter((a) => a.id !== currentId)
  if (list.length === 0) return null
  const i = Math.floor(Math.random() * list.length)
  return list[i].id
}

async function switchToRandom() {
  if (artworkStore.artworks.length < 2) {
    await artworkStore.fetchArtworks().catch(() => {})
  }
  const nextId = pickRandomOtherId(id.value)
  if (!nextId) return
  await router.push({
    path: `/${nextId}`,
    query: analyzeMode.value ? { analyse: 'true' } : undefined,
  })
}

async function loadArtwork() {
  error.value = ''
  notFound.value = false
  loading.value = false
  manualResult.value = null
  if (uploadedImageUrl.value) {
    URL.revokeObjectURL(uploadedImageUrl.value)
    uploadedImageUrl.value = null
    pendingFile.value = null
  }
  if (!id.value) {
    error.value = '无效作品 ID'
    notFound.value = true
    return
  }
  try {
    let a = artworkStore.artworks.find((x) => x.id === id.value)
    if (!a) {
      a = await $fetch<import('~/stores/artwork').Artwork>(`/api/artworks/${id.value}`)
    }
    artwork.value = a
    syncEditableFromResult()

    if (analyzeMode.value && !a.analysisResult) {
      const autoKey = `auto:${a.id}:${a.imageUrl}`
      if (inFlightAnalyzeKey.value === autoKey) return
      loading.value = true
      inFlightAnalyzeKey.value = autoKey
      try {
        const res = await classifyByUrl(a.imageUrl)
        const updated = await artworkStore.updateArtworkAnalysis(a.id, {
          styles: res.styles,
          painters: res.painters,
          rawLabels: res.rawLabels,
        })
        artwork.value = updated
        syncEditableFromResult()
        await loadModelStyles()
      } finally {
        if (inFlightAnalyzeKey.value === autoKey) inFlightAnalyzeKey.value = null
      }
    } else if (result.value) {
      await loadModelStyles()
    }
  } catch (e: unknown) {
    const statusCode = (e as { statusCode?: number })?.statusCode
    if (statusCode === 404) {
      error.value = '作品不存在'
      notFound.value = true
    } else {
      error.value = e instanceof Error ? e.message : '加载失败'
    }
    artwork.value = null
  } finally {
    loading.value = false
  }
}

function triggerUpload() {
  fileInput.value?.click()
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return
  if (uploadedImageUrl.value) URL.revokeObjectURL(uploadedImageUrl.value)
  uploadedImageUrl.value = URL.createObjectURL(file)
  pendingFile.value = file
  manualResult.value = null
  error.value = ''
  input.value = ''
}

async function analyze() {
  const baseImageUrl = artwork.value?.imageUrl
  if (!pendingFile.value && !baseImageUrl) return
  const analyzeKey = pendingFile.value
    ? `file:${pendingFile.value.name}:${pendingFile.value.size}:${pendingFile.value.lastModified}`
    : `url:${baseImageUrl as string}`
  if (inFlightAnalyzeKey.value === analyzeKey) return
  loading.value = true
  error.value = ''
  inFlightAnalyzeKey.value = analyzeKey
  try {
    const res = pendingFile.value
      ? await classifyByFile(pendingFile.value)
      : await classifyByUrl(baseImageUrl as string)
    manualResult.value = res
    syncEditableFromResult()
    await loadModelStyles()
    if (pendingFile.value && res.imageUrl) {
      if (uploadedImageUrl.value) URL.revokeObjectURL(uploadedImageUrl.value)
      uploadedImageUrl.value = null
      pendingFile.value = null
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '分析失败'
  } finally {
    if (inFlightAnalyzeKey.value === analyzeKey) inFlightAnalyzeKey.value = null
    loading.value = false
  }
}

async function saveToGallery() {
  const r = result.value
  if (!r) return
  savingToGallery.value = true
  try {
    const normalizedPainters = normalizePaintersInput(editablePainters.value)
    const resolvedStyle = (selectedStyle.value || aiTopStyle.value || r.styles[0]?.name || '').trim()
    const resolvedTitle = (title.value || resolvedStyle || '未命名').trim()
    const created = await artworkStore.addArtwork({
      title: resolvedTitle,
      style: resolvedStyle,
      imageUrl: r.imageUrl,
      isPublic: true,
      analysisResult: {
        styles: r.styles,
        painters: normalizedPainters.length > 0 ? normalizedPainters : r.painters,
        rawLabels: r.rawLabels,
      },
    })
    manualResult.value = null
    title.value = ''
    selectedStyle.value = ''
    editablePainters.value = []
    await new Promise<void>((resolve) => setTimeout(resolve, 150))
    await router.replace(`/${created.id}?analyse=true`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    savingToGallery.value = false
  }
}

onMounted(async () => {
  if (artworkStore.artworks.length === 0) {
    artworkStore.fetchArtworks().catch(() => {})
  }
  await loadArtwork()
  if (result.value) {
    await loadModelStyles()
  }
  if (frameRef.value) {
    VanillaTilt.init(frameRef.value, { max: 8, glare: true, 'max-glare': 0.2, scale: 1.02 })
  }
})

const frameRef = ref<HTMLElement | null>(null)
watch([id, analyzeMode], loadArtwork)

onUnmounted(() => {
  if (uploadedImageUrl.value) URL.revokeObjectURL(uploadedImageUrl.value)
  const tilt = (frameRef.value as (HTMLElement & { vanillaTilt?: { destroy: () => void } }) | null)?.vanillaTilt
  tilt?.destroy()
})
</script>

<style scoped>
.page { height: 100%; min-height: 0; overflow: hidden; width: 100%; display: flex; flex-direction: column; --ui-text: #f4f7fb; --ui-muted: rgba(244, 247, 251, 0.78); --ui-panel-bg: rgba(10, 14, 20, 0.44); --ui-panel-border: rgba(255, 255, 255, 0.28); --ui-divider: rgba(255, 255, 255, 0.2); color: var(--ui-text); }
.page-inner { height: 100%; display: flex; flex-direction: column; position: relative; overflow: hidden; }
.page-bg-blur { position: absolute; inset: 0; background-size: cover; background-position: center; filter: blur(14px) saturate(0.95); opacity: 0.68; transform: scale(1.16); transform-origin: center center; z-index: 0; }
.page-bg-shadow { position: absolute; inset: 0; background-size: cover; background-position: center; opacity: 0.46; filter: blur(2px) saturate(1.02) brightness(0.95); transform: scale(1.08); z-index: 0; }
.page-bg-overlay { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.16) 20%, rgba(0,0,0,0.1) 45%, rgba(0,0,0,0.18) 100%); z-index: 1; pointer-events: none; }
.page-main { flex: 1; min-height: 0; padding: 18px 3vw 20px; position: relative; z-index: 2; display: flex; justify-content: center; }
.content-shell { width: min(90vw, 1600px); min-height: 0; display: flex; align-items: center; gap: 28px; --art-stage-width: min(58vw, 960px); }
.art-stage { min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 16px; width: var(--art-stage-width); transition: width 0.35s ease; }
.phase-idle .art-stage { align-items: center; }
.phase-idle .content-shell { justify-content: center; }
.phase-analyzing .art-stage, .phase-resolved .art-stage { align-items: flex-start; }
.phase-analyzing .content-shell, .phase-resolved .content-shell { justify-content: space-between; }
.frame-container { flex-shrink: 0; width: 100%; min-height: 240px; border-radius: 12px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1); transform-style: preserve-3d; }
.frame-inner { width: 100%; height: 100%; border-radius: inherit; overflow: hidden; }
.frame-img { width: 100%; height: 100%; }
.frame-skeleton { width: 100%; height: 100%; min-height: 240px; border-radius: inherit; background: linear-gradient(90deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.18) 50%, rgba(255,255,255,0.08) 100%); background-size: 200% 100%; animation: skeleton-flow 1.4s linear infinite; }
@keyframes skeleton-flow { from { background-position: 200% 0; } to { background-position: -200% 0; } }
.result-side { width: min(45%, 680px); min-width: 320px; display: flex; justify-content: flex-end; }
.switch-artwork-fab { position: fixed; right: 24px; bottom: 24px; z-index: 100; min-width: 44px; min-height: 44px; }
.controls-row { display: flex; align-items: center; gap: 8px; width: 100%; }
.controls-actions-group { display: flex; align-items: center; gap: 8px; width: 100%; }
.upload-btn { color: var(--ui-text) !important; border-color: var(--ui-panel-border) !important; }
.glass-tools { width: 100%; background: rgba(8, 12, 18, 0.42); border: 1px solid var(--ui-panel-border); border-radius: 14px; padding: 12px; backdrop-filter: blur(18px); }
.analyze-btn--d:hover:not(.v-btn--disabled) { transform: scale(1.03); }
.analyze-btn--d:active:not(.v-btn--disabled) { transform: scale(0.98); }
@media (max-width: 599px) { .page-main { padding: 10px 12px 14px; } .content-shell { width: 100%; flex-direction: column; gap: 14px; } .art-stage { width: 100%; } .result-side { width: 100%; min-width: 0; } .switch-artwork-fab { right: 16px; bottom: 16px; } }
</style>
