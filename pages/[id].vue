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

      <main class="page-main" :class="[`phase-${viewPhase}`, `mobile-view-${activeMobileView}`]">
        <div class="content-shell">
          <section class="art-stage">
            <div class="mobile-artwork-group">
              <div
                ref="frameRef"
                class="frame-container"
                :class="{ 'frame-container--empty': !displayImageSrc }"
                :style="{ aspectRatio: frameAspectRatio }"
              >
                <div class="frame-inner">
                  <v-img
                    v-if="displayImageSrc"
                    :src="displayImageSrc"
                    contain
                    eager
                    class="frame-img"
                  />
                  <div v-else class="frame-skeleton">
                    <div class="frame-empty-label">
                      <span class="frame-empty-kicker">ArtMind</span>
                      <span class="frame-empty-title">选择一张作品开始分析</span>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mobile-art-caption">
                {{ uploadFileName || '当前作品' }}
              </div>
            </div>
            <div class="mobile-action-flow">
              <AnalysisUploadCommand
                v-bind="uploadBindings"
                @upload="triggerUpload"
                @analyze="analyze"
              />
              <div class="mobile-secondary-actions">
                <button
                  type="button"
                  class="mobile-secondary-action"
                  :disabled="pageBusy"
                  @click="triggerUpload"
                >
                  ↑ 更换图片
                </button>
                <button
                  type="button"
                  class="mobile-secondary-action"
                  :disabled="pageBusy || !canSwitch"
                  @click="switchToRandom"
                >
                  <v-icon icon="mdi-shuffle-variant" size="16" />
                  换一张
                </button>
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
            <button
              v-if="viewPhase === 'resolved'"
              type="button"
              class="mobile-back-to-artwork"
              @click="showMobileArtwork"
            >
              返回作品
            </button>
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
        :disabled="pageBusy || !canSwitch"
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

import type { AnalysisDisplayResult } from '~/composables/useAnalysisSession'
import { normalizeArtworkTitle, resolveAnalysisViewPhase } from '~/utils/analysis-helpers'
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
const analysisSession = useAnalysisSession()

const artworkLoading = ref(false)
const pageError = ref('')
const notFound = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const title = ref('')
const selectedStyle = ref('')
const editablePainters = ref<string[]>([])
const modelStyles = ref<string[]>([])
const modelStylesLoaded = ref(false)
const modelStylesLoading = ref(false)
let loadSequence = 0
const saveDialogOpen = ref(false)
const outputMode = ref<'polished' | 'raw'>('polished')
const mobileView = ref<'showcase' | 'result'>('showcase')
const mobileSawAnalyzing = ref(false)

const subject = analysisSession.subject
const result = computed(() => analysisSession.activeResult.value)
const error = computed(() => analysisSession.errorMessage.value || pageError.value)

const displayImageSrc = computed(() => {
  const s = subject.value
  if (s?.type === 'local-file') return s.previewUrl
  if (result.value?.imageUrl) return encodeUrl(result.value.imageUrl)
  if (s?.type === 'artwork') return encodeUrl(s.artwork.imageUrl)
  return ''
})

const viewPhase = computed<'idle' | 'analyzing' | 'resolved'>(() => {
  return resolveAnalysisViewPhase({
    analysisPhase: analysisSession.analysisPhase.value,
    hasActiveResult: !!result.value,
  })
})
const activeMobileView = computed<'showcase' | 'loading' | 'result'>(() => {
  if (viewPhase.value === 'analyzing') return 'loading'
  if (viewPhase.value === 'resolved') return mobileView.value
  return 'showcase'
})

const frameAspectRatio = computed(() => {
  const s = subject.value
  const a = s?.type === 'artwork' ? s.artwork : null
  if (
    s?.type === 'artwork' &&
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
const pageBusy = computed(
  () => artworkLoading.value || analysisSession.analysisPhase.value === 'running',
)
const currentArtwork = computed(() =>
  subject.value?.type === 'artwork' ? subject.value.artwork : null,
)
const currentLocalFile = computed(() =>
  subject.value?.type === 'local-file' ? subject.value.file : null,
)
const canAnalyze = computed(() => !!currentLocalFile.value || !!currentArtwork.value?.imageUrl)

const uploadPhase = computed<'idle' | 'ready' | 'analyzing' | 'resolved'>(() => {
  if (analysisSession.analysisPhase.value === 'running') return 'analyzing'
  if (result.value) return 'resolved'
  if (canAnalyze.value) return 'ready'
  return 'idle'
})

const uploadFileName = computed(() => {
  if (currentLocalFile.value?.name) return currentLocalFile.value.name
  const titleText = currentArtwork.value?.title?.trim()
  if (titleText) return titleText
  return ''
})

const uploadBindings = computed(() => ({
  phase: uploadPhase.value,
  canAnalyze: canAnalyze.value,
  loading: analysisSession.analysisPhase.value === 'running',
  fileName: uploadFileName.value,
  previewUrl: displayImageSrc.value || undefined,
}))
const isExistingOwned = computed(() => {
  const a = currentArtwork.value
  const uid = auth.user.value?.id
  return !!(a && uid && a.userId === uid && analyzeMode.value && subject.value?.type === 'artwork')
})
const isSavedArtwork = computed(() => subject.value?.type === 'artwork')
const artworkActionPermissions = computed(() =>
  buildArtworkActionPermissions({
    authLoading: auth.loading.value,
    isAuthenticated: auth.isAuthenticated.value,
    hasResult: !!result.value,
    isExistingOwned: isExistingOwned.value,
    isSavedArtwork: isSavedArtwork.value,
  }),
)
const showSaveToGallery = computed(() => artworkActionPermissions.value.showSaveToGallery)
const showUpdateArtwork = computed(() => artworkActionPermissions.value.showUpdateArtwork)
const currentArtworkAction = computed(() => resolveArtworkAction(artworkActionPermissions.value))
const canOpenArtworkActionDialog = computed(
  () => artworkActionPermissions.value.canOpenArtworkActionDialog,
)
const savingToGallery = computed(() => analysisSession.persistPhase.value === 'saving')
const updatingArtwork = computed(() => analysisSession.persistPhase.value === 'updating')
const canSaveToGallery = computed(
  () =>
    showSaveToGallery.value &&
    analysisSession.analysisPhase.value !== 'running' &&
    analysisSession.persistPhase.value !== 'saving',
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
  const a = currentArtwork.value
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

function applyResolvedArtwork(updated: import('~/stores/artwork').Artwork) {
  artworkStore.cacheArtwork(updated)
  analysisSession.commitSavedArtwork(updated, result.value)
  syncEditableFromResult()
}

async function runAnalysisRequest(
  executor: () => Promise<AnalysisDisplayResult>,
  options: { requestPermission: boolean; showStartNotice: boolean; isCurrent?: () => boolean },
) {
  if (options.showStartNotice) {
    toast.info('分析可能需要较长时间，可以切到别的标签页等待，但不要关闭或刷新当前页面。')
  }

  await analysisNotifications.prepareForAnalysis({ requestPermission: options.requestPermission })

  try {
    const res = await executor()
    if (options.isCurrent && !options.isCurrent()) return res
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
    if (options.isCurrent && !options.isCurrent()) throw e
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

function showMobileArtwork() {
  mobileView.value = 'showcase'
}

function showMobileResult() {
  if (viewPhase.value === 'resolved') mobileView.value = 'result'
}

async function loadArtwork() {
  const sequence = ++loadSequence
  pageError.value = ''
  notFound.value = false
  analysisSession.cancelAnalysis()

  if (!id.value) {
    pageError.value = '无效作品 ID'
    notFound.value = true
    artworkLoading.value = false
    return
  }

  if (currentArtwork.value?.id !== id.value) {
    analysisSession.clearResult()
  }

  if (currentArtwork.value?.id === id.value && currentArtwork.value.analysisResult) {
    artworkLoading.value = false
    syncEditableFromResult()
    if (analyzeMode.value) await loadModelStyles()
    return
  }

  try {
    let a = artworkStore.cachedArtworkById(id.value) ?? undefined
    if (!a) {
      artworkLoading.value = true
      a = (await artworkStore.fetchArtworkById(id.value)) ?? undefined
      if (sequence !== loadSequence) return
    }

    if (!a) {
      pageError.value = '作品不存在'
      notFound.value = true
      artworkLoading.value = false
      return
    }

    analysisSession.syncRouteArtwork(a)
    syncEditableFromResult()
    artworkLoading.value = false

    if (analyzeMode.value && !a.analysisResult) {
      const requestId = analysisSession.beginAnalysis()
      mobileSawAnalyzing.value = true
      try {
        const res = await runAnalysisRequest(() => classifyByUrl(a.imageUrl), {
          requestPermission: false,
          showStartNotice: false,
          isCurrent: () => sequence === loadSequence && analysisSession.isCurrentRequest(requestId),
        })
        if (sequence !== loadSequence || !analysisSession.isCurrentRequest(requestId)) return
        const uid = auth.user.value?.id
        if (uid && a.userId === uid) {
          const updated = await artworkStore.updateArtworkAnalysis(a.id, {
            styles: res.styles,
            painters: res.painters,
            rawLabels: res.rawLabels,
          })
          if (sequence !== loadSequence || !analysisSession.isCurrentRequest(requestId)) return
          analysisSession.resolveAnalysis(requestId, {
            styles: res.styles,
            painters: res.painters,
            imageUrl: updated.imageUrl,
            rawLabels: res.rawLabels,
          })
          analysisSession.setArtwork(updated, { preserveResult: true })
        } else {
          analysisSession.resolveAnalysis(requestId, {
            styles: res.styles,
            painters: res.painters,
            imageUrl: a.imageUrl,
            rawLabels: res.rawLabels,
          })
        }
        syncEditableFromResult()
        await loadModelStyles()
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : '分析失败'
        analysisSession.rejectAnalysis(requestId, message)
      }
    } else if (result.value) {
      await loadModelStyles()
    }
  } catch (e: unknown) {
    if (sequence !== loadSequence) return
    const statusCode = (e as { statusCode?: number })?.statusCode
    if (statusCode === 404) {
      pageError.value = '作品不存在'
      notFound.value = true
    } else {
      pageError.value = e instanceof Error ? e.message : '加载失败'
    }
  } finally {
    if (sequence === loadSequence) artworkLoading.value = false
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
  const currentSubject = subject.value
  if (currentSubject?.type === 'local-file') URL.revokeObjectURL(currentSubject.previewUrl)
  loadSequence += 1
  artworkLoading.value = false
  notFound.value = false
  pageError.value = ''
  analysisSession.setLocalFile(file, URL.createObjectURL(file))
  showMobileArtwork()
}

async function analyze() {
  const localFile = currentLocalFile.value
  const baseImageUrl = currentArtwork.value?.imageUrl
  if (!localFile && !baseImageUrl) return
  const sequence = ++loadSequence
  const requestId = analysisSession.beginAnalysis()
  mobileSawAnalyzing.value = true
  try {
    const res = await runAnalysisRequest(
      () => (localFile ? classifyByFile(localFile) : classifyByUrl(baseImageUrl as string)),
      {
        requestPermission: true,
        showStartNotice: true,
        isCurrent: () => sequence === loadSequence && analysisSession.isCurrentRequest(requestId),
      },
    )
    if (sequence !== loadSequence || !analysisSession.resolveAnalysis(requestId, res)) return
    syncEditableFromResult()
    await loadModelStyles()
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : '分析失败'
    analysisSession.rejectAnalysis(requestId, message)
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
  const resultImageUrl = r.imageUrl?.trim()
  if (!resultImageUrl) {
    pageError.value = '缺少图片地址，无法保存'
    return
  }
  analysisSession.setPersistPhase('saving')
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
    const analysisResult = {
      styles: r.styles,
      painters: normalizedPainters.length > 0 ? normalizedPainters : r.painters,
      rawLabels: r.rawLabels,
    }
    const created = await artworkStore.addArtwork({
      title: resolvedTitle,
      style: resolvedStyle,
      imageUrl: resultImageUrl,
      isPublic: false,
      aiPainters: r.painters,
      analysisResult,
    })
    saveDialogOpen.value = false
    const hydratedAnalysis = created.analysisResult ?? analysisResult
    applyResolvedArtwork({
      ...created,
      analysisResult: hydratedAnalysis,
    })
    toast.success('已保存到你的画廊（仅自己可见）')
    await router.replace(`/${created.id}?analyse=true`)
  } catch (e: unknown) {
    pageError.value = e instanceof Error ? e.message : '保存失败'
  } finally {
    analysisSession.setPersistPhase('idle')
  }
}

async function updateOwnedArtwork(draft?: {
  title: string
  selectedStyle: string
  editablePainters: string[]
}) {
  if (!canSubmitArtworkAction('update', artworkActionPermissions.value)) return
  const a = currentArtwork.value
  const r = result.value
  if (!a || !r) return
  analysisSession.setPersistPhase('updating')
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
    applyResolvedArtwork(updated)
    toast.success('作品已更新')
  } catch (e: unknown) {
    pageError.value = e instanceof Error ? e.message : '更新失败'
  } finally {
    analysisSession.setPersistPhase('idle')
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
watch(id, () => {
  showMobileArtwork()
  mobileSawAnalyzing.value = false
})
watch(viewPhase, (phase) => {
  if (phase === 'analyzing') {
    mobileSawAnalyzing.value = true
    return
  }

  if (phase === 'resolved' && mobileSawAnalyzing.value) {
    showMobileResult()
    mobileSawAnalyzing.value = false
  }
})

onUnmounted(() => {
  if (subject.value?.type === 'local-file') URL.revokeObjectURL(subject.value.previewUrl)
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
.mobile-artwork-group {
  display: contents;
}
.mobile-action-flow {
  width: 100%;
}
.mobile-art-caption {
  display: none;
}
.mobile-secondary-actions {
  display: none;
}
.mobile-back-to-artwork {
  display: none;
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
  display: flex;
  align-items: center;
  justify-content: center;
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
.frame-empty-label {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 18px 20px;
  color: rgba(244, 247, 251, 0.86);
  text-align: center;
  animation: hero-in 0.32s ease-out both;
}
.frame-empty-kicker {
  font-size: 0.7rem;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: rgba(232, 213, 163, 0.9);
}
.frame-empty-title {
  font-size: 1.05rem;
  font-weight: 600;
}
@keyframes skeleton-flow {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
@keyframes result-side-fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.result-side {
  width: min(45%, 680px);
  min-width: 320px;
  display: flex;
  justify-content: flex-end;
  animation: result-side-fade-in 0.26s ease both;
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
  .page {
    height: auto;
    min-height: 100%;
    overflow: visible;
    --ui-panel-bg: rgba(28, 27, 24, 0.62);
    --ui-panel-border: rgba(255, 255, 255, 0.16);
    --ui-divider: rgba(255, 255, 255, 0.14);
  }

  .page-inner {
    min-height: 100%;
    height: auto;
    overflow: visible;
    padding-bottom: env(safe-area-inset-bottom);
  }

  .page-bg-blur,
  .page-bg-shadow,
  .page-bg-overlay {
    position: fixed;
  }

  .page-main {
    min-height: calc(100dvh - 56px);
    padding: 0 12px calc(16px + env(safe-area-inset-bottom));
    align-items: center;
  }

  .content-shell {
    width: 100%;
    min-height: calc(100dvh - 72px);
    flex-direction: column;
    align-items: stretch;
    justify-content: center;
    gap: 12px;
  }

  .mobile-view-showcase .result-side {
    display: none;
  }

  .mobile-view-showcase .art-stage {
    min-height: calc(100dvh - 72px);
    display: grid;
    grid-template-rows: minmax(0, 1fr) auto;
    grid-template-areas:
      'art'
      'actions';
    align-items: stretch;
    justify-content: stretch;
  }

  .mobile-view-loading .art-stage {
    display: none;
  }

  .mobile-view-loading .result-side {
    width: 100%;
    min-width: 0;
    min-height: calc(100dvh - 72px);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: none;
  }

  .mobile-view-loading .analysis-panel.glass-panel {
    width: 100%;
    min-height: calc(100dvh - 96px);
    display: flex;
    align-items: center;
    justify-content: center;
    background: transparent;
    border: 0;
    box-shadow: none;
    animation: result-side-fade-in 0.28s ease both;
  }

  .mobile-view-loading .analysis-panel.glass-panel::before {
    display: none;
  }

  .mobile-view-result .art-stage {
    display: none;
  }

  .mobile-view-result .result-side {
    width: 100%;
    min-width: 0;
    min-height: calc(100dvh - 72px);
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    justify-content: center;
    padding-block: 10px;
  }

  .mobile-back-to-artwork {
    display: inline-flex;
    align-self: center;
    align-items: center;
    justify-content: center;
    gap: 6px;
    width: min(78%, 320px);
    min-height: 44px;
    padding: 10px 18px;
    border: 0;
    border-radius: 999px;
    background: linear-gradient(90deg, #c9a962, #e8d5a3);
    color: #1a1510;
    box-shadow: 0 12px 24px -18px rgba(0, 0, 0, 0.54);
    font: inherit;
    font-size: 1rem;
    font-weight: 600;
    cursor: pointer;
  }

  .art-stage {
    width: 100%;
    gap: 12px;
  }

  .mobile-artwork-group {
    grid-area: art;
    align-self: center;
    justify-self: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    width: 100%;
  }

  .frame-container {
    width: calc(100% + 24px);
    margin-inline: -12px;
    min-height: 50vh;
    border-radius: 0 0 18px 18px;
    box-shadow:
      0 18px 34px -20px rgba(0, 0, 0, 0.68),
      0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .mobile-art-caption {
    display: block;
    max-width: min(82vw, 320px);
    color: rgba(244, 247, 251, 0.88);
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
    text-shadow: 0 2px 16px rgba(0, 0, 0, 0.36);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .frame-container--empty {
    width: 100%;
    min-height: 156px;
    margin-inline: 0;
    aspect-ratio: auto !important;
    border-radius: 18px;
  }

  .frame-container--empty .frame-skeleton {
    min-height: 156px;
    background:
      linear-gradient(135deg, rgba(246, 242, 231, 0.16), rgba(246, 242, 231, 0.05)),
      radial-gradient(circle at 50% 20%, rgba(232, 213, 163, 0.18), transparent 42%);
  }

  .frame-empty-label {
    padding: 16px;
  }

  .frame-empty-title {
    font-size: 0.98rem;
  }

  .frame-img {
    min-height: 50vh;
    max-height: 58vh;
  }

  .mobile-action-flow {
    grid-area: actions;
    align-self: end;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 0 0 max(18px, env(safe-area-inset-bottom));
  }

  .mobile-secondary-actions {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 18px;
    order: 3;
    width: 100%;
  }

  .mobile-secondary-action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 36px;
    padding: 6px 8px;
    border: 0;
    background: transparent;
    color: rgba(244, 247, 251, 0.78);
    font: inherit;
    font-size: 0.92rem;
    cursor: pointer;
  }

  .mobile-secondary-action:disabled {
    opacity: 0.36;
    cursor: not-allowed;
  }

  .result-side {
    width: 100%;
    min-width: 0;
    justify-content: stretch;
  }

  .switch-artwork-fab {
    display: none;
  }
}
</style>
