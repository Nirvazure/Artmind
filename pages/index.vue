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
          <section
            class="art-stage"
            v-motion
            :initial="{ opacity: 0, y: 18 }"
            :enter="{ opacity: 1, y: 0, transition: { duration: 420, easing: 'ease-out' } }"
          >
            <div ref="frameRef" class="frame-container">
              <div class="frame-inner">
                <v-img
                  v-if="displayImageSrc"
                  :src="displayImageSrc"
                  cover
                  eager
                  class="frame-img"
                />
                <div v-else class="frame-skeleton" />
              </div>
            </div>

            <div
              class="glass-tools"
              v-motion
              :initial="{ opacity: 0, y: 12 }"
              :enter="{ opacity: 1, y: 0, transition: { delay: 120, duration: 360, easing: 'ease-out' } }"
            >
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
                    rounded="pill"
                    :loading="loading"
                    :disabled="loading || !canAnalyze"
                    prepend-icon="mdi-magnify"
                    size="small"
                    class="analyze-btn"
                    @click="analyze"
                  >
                    {{ loading ? '分析中' : '分析' }}
                  </v-btn>
                </div>
              </div>
              <v-alert v-if="error" type="error" closable density="compact" class="mt-2">
                {{ error }}
              </v-alert>
            </div>
          </section>

          <section
            v-if="viewPhase !== 'idle'"
            class="result-side"
            v-motion
            :initial="{ opacity: 0, x: 16 }"
            :enter="{ opacity: 1, x: 0, transition: { duration: 320, easing: 'ease-out' } }"
          >
            <div class="glass-panel">
              <Transition name="fade-swap" mode="out-in">
                <div v-if="viewPhase === 'analyzing'" key="loading" class="glass-content skeleton-wrap">
                  <div class="skeleton-line skeleton-title" />
                  <div class="skeleton-chart-row">
                    <div class="skeleton-circle" />
                    <div class="skeleton-list">
                      <div class="skeleton-line" />
                      <div class="skeleton-line" />
                      <div class="skeleton-line short" />
                    </div>
                  </div>
                  <div class="skeleton-line skeleton-subtitle" />
                  <div class="skeleton-line" />
                  <div class="skeleton-line short" />
                  <div class="skeleton-line skeleton-subtitle" />
                  <div class="skeleton-line" />
                </div>

                <div v-else-if="result" key="result" class="glass-content">
                  <div class="glass-section">
                    <div class="glass-title-row">
                      <h3 class="glass-title">流派推测</h3>
                    </div>
                    <!-- <p class="style-primary">
                      {{ result.styles[0]?.name || '—' }}
                      <span class="style-primary-pct">
                        {{ ((result.styles[0]?.confidence ?? 0) * 100).toFixed(0) }}%
                      </span>
                    </p> -->
                    <div class="glass-chart-row">
                      <StyleRingChart :styles="result.styles" />
                      <div class="style-labels">
                        <div
                          v-for="(s, i) in result.styles.slice(0, 3)"
                          :key="i"
                          class="style-label"
                        >
                          <span class="style-name">{{ s.name }}</span>
                          <span class="style-pct">{{ (s.confidence * 100).toFixed(0) }}%</span>
                        </div>
                      </div>
                    </div>
                    <div v-if="result.rawLabels?.length" class="raw-labels mt-2">
                      <p class="raw-labels-title">模型原始输出</p>
                      <div class="raw-labels-list">
                        <div
                          v-for="(r, i) in result.rawLabels.slice(0, 5)"
                          :key="i"
                          class="raw-label-item"
                        >
                          <span class="raw-label-name">{{ r.label }}</span>
                          <span class="raw-label-score">{{ (r.score * 100).toFixed(1) }}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="glass-section">
                    <h3 class="glass-title glass-title-sub">画家推测</h3>
                    <div class="painters-cards">
                      <div
                        v-for="(p, i) in result.painters.slice(0, 3)"
                        :key="i"
                        class="painter-card"
                        :class="{ champion: i === 0 }"
                      >
                        <span class="painter-rank">{{ i + 1 }}</span>
                        <v-avatar
                          :size="i === 0 ? 48 : 40"
                          color="primary"
                          variant="tonal"
                          class="painter-card-avatar"
                        >
                          <span class="avatar-text">{{ (p || '—').trim().charAt(0) }}</span>
                        </v-avatar>
                        <span class="painter-card-name">{{ p || '—' }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="glass-actions">
                    <v-text-field
                      v-model="title"
                      label="作品标题"
                      variant="outlined"
                      density="compact"
                      hide-details
                      class="glass-field"
                      bg-color="rgba(255,255,255,0.1)"
                    />
                    <v-btn
                      color="primary"
                      size="small"
                      @click="saveToGallery"
                    >
                      保存到画廊
                    </v-btn>
                  </div>
                </div>
              </Transition>
            </div>
          </section>

          <input
            ref="fileInput"
            type="file"
            accept="image/*"
            class="d-none"
            @change="onFileSelected"
          >
          </div>
      </main>
      <v-btn
        class="switch-artwork-fab"
        variant="elevated"
        color="primary"
        rounded="lg"
        size="default"
        prepend-icon="mdi-shuffle-variant"
        :disabled="loading || galleryImageUrls.length === 0"
        @click="switchArtwork"
      >
        换一张
      </v-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import VanillaTilt from 'vanilla-tilt'

definePageMeta({ layout: 'home' })

const artworkStore = useArtworkStore()

const galleryImageUrls = computed(() => {
  return artworkStore.artworks.map((a) => a.imageUrl).filter(Boolean)
})

const galleryIndex = ref(0)
const pendingFile = ref<File | null>(null)
const uploadedImageUrl = ref<string | null>(null)
const frameRef = ref<HTMLElement | null>(null)

const loading = ref(false)
const error = ref('')
const result = ref<{
  styles: { name: string; confidence: number }[]
  painters: string[]
  imageUrl: string
  rawLabels?: Array<{ label: string; score: number }>
} | null>(null)
const title = ref('')
const fileInput = ref<HTMLInputElement | null>(null)

const { classifyByUrl, classifyByFile } = useClassifier()

function encodeImageUrl(url: string): string {
  if (!url || url.startsWith('http') || url.startsWith('blob:')) return url
  try {
    return encodeURI(url)
  } catch {
    return url
  }
}

const displayImageSrc = computed(() => {
  if (result.value) return encodeImageUrl(result.value.imageUrl)
  if (uploadedImageUrl.value) return uploadedImageUrl.value
  const urls = galleryImageUrls.value
  const idx = galleryIndex.value % Math.max(1, urls.length)
  return urls[idx] ? encodeImageUrl(urls[idx]) : ''
})

const viewPhase = computed<'idle' | 'analyzing' | 'resolved'>(() => {
  if (loading.value) return 'analyzing'
  if (result.value) return 'resolved'
  return 'idle'
})

const imageToAnalyze = computed(() => {
  if (pendingFile.value) return { type: 'file' as const, file: pendingFile.value }
  if (result.value) return { type: 'url' as const, url: result.value.imageUrl }
  if (uploadedImageUrl.value) return { type: 'url' as const, url: uploadedImageUrl.value }
  const urls = galleryImageUrls.value
  const idx = galleryIndex.value % Math.max(1, urls.length)
  return { type: 'url' as const, url: urls[idx] ?? '' }
})

const canAnalyze = computed(() => {
  const t = imageToAnalyze.value
  return t.type === 'file' || !!t.url
})

onMounted(() => {
  artworkStore.fetchArtworks()
  const urls = galleryImageUrls.value
  if (urls.length > 0) {
    galleryIndex.value = Math.floor(Date.now() / 1000) % urls.length
  }
  if (frameRef.value) {
    VanillaTilt.init(frameRef.value, {
      max: 8,
      glare: true,
      'max-glare': 0.2,
      scale: 1.02,
    })
  }
})

onUnmounted(() => {
  if (frameRef.value && (frameRef.value as { vanillaTilt?: { destroy: () => void } }).vanillaTilt) {
    (frameRef.value as { vanillaTilt: { destroy: () => void } }).vanillaTilt.destroy()
  }
})

function switchArtwork() {
  if (uploadedImageUrl.value) {
    URL.revokeObjectURL(uploadedImageUrl.value)
    uploadedImageUrl.value = null
    pendingFile.value = null
  }
  result.value = null
  const urls = galleryImageUrls.value
  if (urls.length > 0) {
    galleryIndex.value = (galleryIndex.value + 1) % urls.length
  }
}

async function analyze() {
  const target = imageToAnalyze.value
  if (!target) return
  loading.value = true
  error.value = ''
  result.value = null
  try {
    const res = target.type === 'file'
      ? await classifyByFile(target.file)
      : await classifyByUrl(target.url)
    result.value = res
    title.value = res.styles[0]?.name ?? ''
    if (target.type === 'file' && res.imageUrl) {
      if (uploadedImageUrl.value) URL.revokeObjectURL(uploadedImageUrl.value)
      uploadedImageUrl.value = null
      pendingFile.value = null
    }
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '分析失败'
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
  result.value = null
  error.value = ''
  input.value = ''
}

async function saveToGallery() {
  if (!result.value) return
  try {
    await artworkStore.addArtwork({
      title: (title.value || result.value.styles[0]?.name) ?? '未命名',
      style: result.value.styles[0]?.name ?? '',
      imageUrl: result.value.imageUrl,
      isPublic: true,
    })
    result.value = null
    title.value = ''
  } catch (e: unknown) {
    error.value = e instanceof Error ? e.message : '保存失败'
  }
}

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
  --ui-tools-bg: rgba(8, 12, 18, 0.42);
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
  background:
    linear-gradient(
      180deg,
      rgba(0, 0, 0, 0.28) 0%,
      rgba(0, 0, 0, 0.16) 20%,
      rgba(0, 0, 0, 0.1) 45%,
      rgba(0, 0, 0, 0.18) 100%
    ),
    radial-gradient(
      circle at 76% 42%,
      rgba(0, 0, 0, 0.12) 0%,
      rgba(0, 0, 0, 0.03) 46%,
      transparent 65%
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
  transition: width 0.35s ease, transform 0.35s ease;
}

.phase-idle .art-stage {
  align-items: center;
}

.phase-analyzing .art-stage,
.phase-resolved .art-stage {
  align-items: flex-start;
}

.phase-idle .content-shell {
  justify-content: center;
}

.phase-analyzing .content-shell,
.phase-resolved .content-shell {
  justify-content: space-between;
}

.frame-container {
  flex-shrink: 0;
  width: 100%;
  min-height: 240px;
  aspect-ratio: 4/3;
  border-radius: 12px;
  overflow: hidden;
  box-shadow:
    0 25px 50px -12px rgba(0, 0, 0, 0.5),
    0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  transform-style: preserve-3d;
  transition: width 0.35s ease, transform 0.35s ease;
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

.result-side {
  width: min(45%, 680px);
  min-width: 320px;
  display: flex;
  justify-content: flex-end;
}

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

.glass-title-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.glass-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 10px;
  opacity: 1;
}

.glass-title-sub {
  font-weight: 600;
  color: var(--ui-muted);
}

.glass-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.glass-actions .glass-field {
  flex: 1;
  min-width: 140px;
  margin-bottom: 0;
}

.glass-section {
  margin-bottom: 8px;
}

.style-primary {
  margin: 0 0 10px;
  font-size: 1.28rem;
  font-weight: 700;
  line-height: 1.2;
}

.style-primary-pct {
  margin-left: 8px;
  font-size: 0.95rem;
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

.painters-cards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.painter-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.painter-card.champion {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.painter-rank {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(201, 169, 98, 0.9);
  color: #0d0d0d;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.painter-card-avatar {
  flex-shrink: 0;
}

.painter-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 8px;
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


.avatar-text {
  font-size: 1em;
  font-weight: 600;
}

.glass-field {
  margin-bottom: 12px;
}

.controls-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.controls-actions-group {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.upload-btn {
  color: var(--ui-text) !important;
  border-color: var(--ui-panel-border) !important;
}

.upload-btn:hover {
  background: color-mix(in srgb, var(--ui-panel-bg) 70%, transparent) !important;
}

.glass-tools {
  width: 100%;
  background: var(--ui-tools-bg);
  border: 1px solid var(--ui-panel-border);
  border-radius: 14px;
  padding: 12px;
  backdrop-filter: blur(18px);
}


.analyze-btn {
  min-width: 96px;
}

.switch-artwork-fab {
  position: fixed;
  right: 24px;
  bottom: 24px;
  z-index: 100;
}

.glass-content .glass-section {
  padding-bottom: 12px;
  border-bottom: 1px solid var(--ui-divider);
}

.glass-content .glass-section:last-of-type {
  border-bottom: 0;
  padding-bottom: 0;
}

.skeleton-wrap {
  gap: 12px;
}

.skeleton-line {
  height: 12px;
  border-radius: 999px;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-flow 1.4s linear infinite;
}

.skeleton-title {
  width: 44%;
  height: 16px;
}

.skeleton-subtitle {
  width: 36%;
}

.skeleton-chart-row {
  display: flex;
  align-items: center;
  gap: 14px;
}

.skeleton-circle {
  width: 112px;
  height: 112px;
  border-radius: 50%;
  background: linear-gradient(
    90deg,
    rgba(255, 255, 255, 0.12) 0%,
    rgba(255, 255, 255, 0.25) 50%,
    rgba(255, 255, 255, 0.12) 100%
  );
  background-size: 200% 100%;
  animation: skeleton-flow 1.4s linear infinite;
}

.skeleton-list {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.short {
  width: 68%;
}

/* Keep skeleton-to-result transition subtle and short */
.fade-swap-enter-active,
.fade-swap-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-swap-enter-from,
.fade-swap-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@keyframes skeleton-flow {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}

@media (max-width: 768px) {
  .page-main {
    padding: 10px 12px 14px;
  }

  .content-shell {
    width: 100%;
    flex-direction: column;
    gap: 14px;
  }

  .phase-idle .art-stage,
  .phase-analyzing .art-stage,
  .phase-resolved .art-stage {
    width: 100%;
  }

  .result-side {
    width: 100%;
    min-width: 0;
  }

  .glass-panel {
    width: 100%;
    max-width: none;
  }

  .controls-row {
    justify-content: flex-start;
  }

  .control-select {
    width: 100%;
    max-width: 100%;
  }
}
</style>
