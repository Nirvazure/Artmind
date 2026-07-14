<template>
  <div class="page">
    <div class="page-inner">
      <div
        class="page-bg-shadow"
        :style="
          displayImageSrc
            ? { backgroundImage: `url(${displayImageSrc})` }
            : { backgroundColor: 'rgba(30, 28, 26, 0.4)' }
        "
      />
      <div
        class="page-bg-blur"
        :style="
          displayImageSrc
            ? { backgroundImage: `url(${displayImageSrc})` }
            : { backgroundColor: 'rgba(40, 38, 36, 0.5)' }
        "
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
            <AnalysisUploadCommand
              v-bind="uploadBindings"
              @upload="triggerUpload"
              @analyze="analyze"
            />
            <v-alert v-if="error" type="error" closable density="compact" class="mt-2">
              {{ error }}
            </v-alert>
            <div v-if="notFound" class="mt-2 d-flex ga-2">
              <v-btn variant="text" color="primary" :to="'/gallery'">去画廊</v-btn>
              <v-btn variant="text" color="primary" :to="'/'">随机一张</v-btn>
            </div>
          </section>

          <section v-if="viewPhase !== 'idle'" class="result-side">
            <AnalysisResultPanel
              v-model:output-mode="outputMode"
              v-model:title="title"
              v-model:selected-style="selectedStyle"
              v-model:editable-painters="editablePainters"
              v-model:save-dialog-open="saveDialogOpen"
              :view-phase="viewPhase"
              :result="result"
              :style-select-items="styleSelectItems"
              :model-styles-loading="modelStylesLoading"
              :saving-to-gallery="savingToGallery"
              :can-save-to-gallery="canSaveToGallery"
              :show-save-to-gallery="showSaveToGallery"
              :show-update-artwork="showUpdateArtwork"
              :can-open-artwork-action-dialog="canOpenArtworkActionDialog"
              :current-artwork-id="id"
              :is-existing-owned="isExistingOwned"
              :updating="updatingArtwork"
              @save-to-gallery="saveToGallery"
              @update-artwork="updateOwnedArtwork"
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
      <input ref="fileInput" type="file" accept="image/*" class="d-none" @change="onFileSelected" />
    </div>
  </div>
</template>

<script setup lang="ts">
import VanillaTilt from 'vanilla-tilt'

import { normalizeArtworkTitle } from '~/utils/analysis-helpers'
import {
  buildArtworkActionPermissions,
  canSubmitArtworkAction,
  resolveArtworkAction,
  resolveDefaultSelectedStyle,
} from '~/utils/artwork-action-permissions'
import { normalizePaintersInput } from '~/utils/painter-options'

definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const id = computed(() => route.params.id as string)
const analyzeMode = computed(() => route.query.analyse === 'true')

const artworkStore = useArtworkStore()
const auth = useAuth()
const toast = useToast()
const { classifyByUrl, classifyByFile } = useClassifier()
const analysisNotifications = useAnalysisNotifications()

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
const updatingArtwork = ref(false)
const saveDialogOpen = ref(false)
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
  if (analyzeMode.value && !notFound.value) return 'analyzing'
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

const uploadPhase = computed<'idle' | 'ready' | 'analyzing' | 'resolved'>(() => {
  if (loading.value) return 'analyzing'
  if (result.value) return 'resolved'
  if (canAnalyze.value) return 'ready'
  return 'idle'
})

const uploadFileName = computed(() => {
  if (pendingFile.value?.name) return pendingFile.value.name
  const titleText = artwork.value?.title?.trim()
  if (titleText) return titleText
  return ''
})

const uploadBindings = computed(() => ({
  phase: uploadPhase.value,
  canAnalyze: canAnalyze.value,
  loading: loading.value,
  fileName: uploadFileName.value,
  previewUrl: displayImageSrc.value || undefined,
}))
const isExistingOwned = computed(() => {
  const a = artwork.value
  const uid = auth.user.value?.id
  return !!(a && uid && a.userId === uid && analyzeMode.value && !manualResult.value)
})
const artworkActionPermissions = computed(() =>
  buildArtworkActionPermissions({
    authLoading: auth.loading.value,
    isAuthenticated: auth.isAuthenticated.value,
    hasResult: !!result.value,
    isExistingOwned: isExistingOwned.value,
  }),
)
const showSaveToGallery = computed(() => artworkActionPermissions.value.showSaveToGallery)
const showUpdateArtwork = computed(() => artworkActionPermissions.value.showUpdateArtwork)
const currentArtworkAction = computed(() => resolveArtworkAction(artworkActionPermissions.value))
const canOpenArtworkActionDialog = computed(
  () => artworkActionPermissions.value.canOpenArtworkActionDialog,
)
const canSaveToGallery = computed(
  () => showSaveToGallery.value && !loading.value && !savingToGallery.value,
)
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

function syncEditableFromResult() {
  const r = result.value
  if (!r) return
  const a = artwork.value
  title.value = a ? a.title : ''
  selectedStyle.value = resolveDefaultSelectedStyle({
    action: currentArtworkAction.value,
    artworkStyle: a?.style,
    aiTopStyle: r.styles[0]?.name,
  })
  editablePainters.value = normalizePaintersInput(
    a?.analysisResult?.painters?.length ? a.analysisResult.painters : r.painters,
  ).slice(0, 3)
}

async function runAnalysisRequest(
  executor: () => Promise<NonNullable<typeof manualResult.value>>,
  options: { requestPermission: boolean; showStartNotice: boolean },
) {
  if (options.showStartNotice) {
    toast.info('分析可能需要较长时间，可以切到别的标签页等待，但不要关闭或刷新当前页面。')
  }

  await analysisNotifications.prepareForAnalysis({ requestPermission: options.requestPermission })

  try {
    const res = await executor()
    const topStyle = res.styles[0]?.name?.trim()
    const notified = await analysisNotifications.notifyIfHidden('ArtMind 分析完成', {
      body: topStyle ? `识别结果：${topStyle}` : '返回页面查看分析结果。',
      tag: 'artmind-analysis-complete',
    })
    if (!notified) {
      toast.success(topStyle ? `分析完成：${topStyle}` : '分析完成')
    }
    return res
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '请返回页面重试'
    await analysisNotifications.notifyIfHidden('ArtMind 分析失败', {
      body: message,
      tag: 'artmind-analysis-failed',
    })
    throw e
  }
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

  if (!id.value) {
    error.value = '无效作品 ID'
    notFound.value = true
    loading.value = false
    return
  }

  if (artwork.value?.id === id.value && artwork.value.analysisResult) {
    loading.value = false
    syncEditableFromResult()
    if (analyzeMode.value) await loadModelStyles()
    return
  }

  manualResult.value = null
  if (uploadedImageUrl.value) {
    URL.revokeObjectURL(uploadedImageUrl.value)
    uploadedImageUrl.value = null
    pendingFile.value = null
  }

  try {
    let a = artworkStore.artworks.find((x) => x.id === id.value)
    if (!a) {
      if (analyzeMode.value) loading.value = true
      else loading.value = false
      a = (await artworkStore.fetchArtworkById(id.value)) ?? undefined
    }

    if (!a) {
      error.value = '作品不存在'
      notFound.value = true
      artwork.value = null
      loading.value = false
      return
    }

    artwork.value = a
    syncEditableFromResult()
    loading.value = analyzeMode.value && !a.analysisResult

    if (analyzeMode.value && !a.analysisResult) {
      const autoKey = `auto:${a.id}:${a.imageUrl}`
      if (inFlightAnalyzeKey.value === autoKey) return
      inFlightAnalyzeKey.value = autoKey
      try {
        const res = await runAnalysisRequest(() => classifyByUrl(a.imageUrl), {
          requestPermission: false,
          showStartNotice: false,
        })
        const uid = auth.user.value?.id
        if (uid && a.userId === uid) {
          const updated = await artworkStore.updateArtworkAnalysis(a.id, {
            styles: res.styles,
            painters: res.painters,
            rawLabels: res.rawLabels,
          })
          artwork.value = updated
        } else {
          manualResult.value = {
            styles: res.styles,
            painters: res.painters,
            imageUrl: a.imageUrl,
            rawLabels: res.rawLabels,
          }
        }
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
  applyDroppedFile(file)
  input.value = ''
}

function applyDroppedFile(file: File) {
  if (uploadedImageUrl.value) URL.revokeObjectURL(uploadedImageUrl.value)
  uploadedImageUrl.value = URL.createObjectURL(file)
  pendingFile.value = file
  manualResult.value = null
  error.value = ''
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
    const res = await runAnalysisRequest(
      () =>
        pendingFile.value
          ? classifyByFile(pendingFile.value)
          : classifyByUrl(baseImageUrl as string),
      {
        requestPermission: true,
        showStartNotice: true,
      },
    )
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

async function saveToGallery(draft?: {
  title: string
  selectedStyle: string
  editablePainters: string[]
}) {
  if (!canSubmitArtworkAction('save', artworkActionPermissions.value)) return
  const r = result.value
  if (!r) return
  savingToGallery.value = true
  try {
    const normalizedPainters = normalizePaintersInput(
      draft?.editablePainters ?? editablePainters.value,
    )
    const resolvedStyle = (
      draft?.selectedStyle ||
      selectedStyle.value ||
      aiTopStyle.value ||
      r.styles[0]?.name ||
      ''
    ).trim()
    const resolvedTitle = normalizeArtworkTitle(draft?.title ?? title.value)
    const created = await artworkStore.addArtwork({
      title: resolvedTitle,
      style: resolvedStyle,
      imageUrl: r.imageUrl,
      isPublic: false,
      aiPainters: r.painters,
      analysisResult: {
        styles: r.styles,
        painters: normalizedPainters.length > 0 ? normalizedPainters : r.painters,
        rawLabels: r.rawLabels,
      },
    })
    saveDialogOpen.value = false
    await nextTick()
    artwork.value = created
    manualResult.value = null
    syncEditableFromResult()
    toast.success('已保存到你的画廊（仅自己可见）')
    await router.replace(`/${created.id}?analyse=true`)
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    savingToGallery.value = false
  }
}

async function updateOwnedArtwork(draft?: {
  title: string
  selectedStyle: string
  editablePainters: string[]
}) {
  if (!canSubmitArtworkAction('update', artworkActionPermissions.value)) return
  const a = artwork.value
  const r = result.value
  if (!a || !r) return
  updatingArtwork.value = true
  try {
    const normalizedPainters = normalizePaintersInput(
      draft?.editablePainters ?? editablePainters.value,
    )
    const resolvedStyle = (
      draft?.selectedStyle ||
      selectedStyle.value ||
      aiTopStyle.value ||
      r.styles[0]?.name ||
      ''
    ).trim()
    const resolvedTitle = normalizeArtworkTitle(draft?.title ?? title.value)
    const updated = await artworkStore.patchArtwork(a.id, {
      title: resolvedTitle,
      style: resolvedStyle,
      aiPainters: r.painters,
      analysisResult: {
        styles: r.styles,
        painters: normalizedPainters.length > 0 ? normalizedPainters : r.painters,
        rawLabels: r.rawLabels,
      },
    })
    saveDialogOpen.value = false
    await nextTick()
    artwork.value = updated
    syncEditableFromResult()
    toast.success('作品已更新')
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '更新失败'
  } finally {
    updatingArtwork.value = false
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
  const tilt = (frameRef.value as (HTMLElement & { vanillaTilt?: { destroy: () => void } }) | null)
    ?.vanillaTilt
  tilt?.destroy()
})
</script>

<style scoped>
.page {
  height: 100%;
  min-height: 0;
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: column;
  --ui-text: #f4f7fb;
  --ui-muted: rgba(244, 247, 251, 0.78);
  --ui-panel-bg: rgba(10, 14, 20, 0.44);
  --ui-panel-border: rgba(255, 255, 255, 0.28);
  --ui-divider: rgba(255, 255, 255, 0.2);
  color: var(--ui-text);
}
.page-inner {
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
  overflow: hidden;
}
.page-bg-blur {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  filter: blur(14px) saturate(0.95);
  opacity: 0.68;
  transform: scale(1.16);
  transform-origin: center center;
  z-index: 0;
}
.page-bg-shadow {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.46;
  filter: blur(2px) saturate(1.02) brightness(0.95);
  transform: scale(1.08);
  z-index: 0;
}
.page-bg-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.28) 0%,
    rgba(0, 0, 0, 0.16) 20%,
    rgba(0, 0, 0, 0.1) 45%,
    rgba(0, 0, 0, 0.18) 100%
  );
  z-index: 1;
  pointer-events: none;
}
.page-main {
  flex: 1;
  min-height: 0;
  padding: 18px 3vw 20px;
  position: relative;
  z-index: 2;
  display: flex;
  justify-content: center;
}
.content-shell {
  width: min(90vw, 1600px);
  min-height: 0;
  display: flex;
  align-items: center;
  gap: 28px;
  --art-stage-width: min(58vw, 960px);
}
.art-stage {
  min-width: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: var(--art-stage-width);
  transition: width 0.35s ease;
}
.phase-idle .art-stage {
  align-items: center;
}
.phase-idle .content-shell {
  justify-content: center;
}
.phase-analyzing .art-stage,
.phase-resolved .art-stage {
  align-items: flex-start;
}
.phase-analyzing .content-shell,
.phase-resolved .content-shell {
  justify-content: space-between;
}
.frame-container {
  flex-shrink: 0;
  width: 100%;
  min-height: 240px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1);
  transform-style: preserve-3d;
}
.frame-inner {
  width: 100%;
  height: 100%;
  border-radius: inherit;
  overflow: hidden;
}
.frame-img {
  width: 100%;
  height: 100%;
}
.frame-skeleton {
  width: 100%;
  height: 100%;
  min-height: 240px;
  border-radius: inherit;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.08) 0%,
    rgba(255, 255, 255, 0.18) 50%,
    rgba(255, 255, 255, 0.08) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-flow 1.4s linear infinite;
}
@keyframes skeleton-flow {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
.result-side {
  width: min(45%, 680px);
  min-width: 320px;
  display: flex;
  justify-content: flex-end;
}
.switch-artwork-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
  min-width: 44px;
  min-height: 44px;
}
@media (max-width: 599px) {
  .page-main {
    padding: 10px 12px 14px;
  }
  .content-shell {
    width: 100%;
    flex-direction: column;
    gap: 14px;
  }
  .art-stage {
    width: 100%;
  }
  .result-side {
    width: 100%;
    min-width: 0;
  }
  .switch-artwork-fab {
    right: 16px;
    bottom: 16px;
  }
}
</style>
