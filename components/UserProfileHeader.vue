<template>
  <div class="profile-header" :class="[`variant-${variant}`]">
    <input
      ref="fileInputRef"
      type="file"
      accept="image/*"
      class="d-none"
      @change="onFileSelect"
    >
    <!-- stacked: 顶栏头图 + 头像区 -->
    <template v-if="variant === 'stacked'">
      <div class="cover" aria-hidden="true">
        <svg class="cover-art" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
          <rect fill="#5c5046" opacity="0.12" width="400" height="140" />
          <polygon fill="#6b5b4f" opacity="0.18" points="0,140 120,40 240,100 400,20 400,140" />
          <rect fill="#2e2c2a" opacity="0.08" x="0" y="60" width="180" height="80" />
          <circle fill="#5c5046" opacity="0.1" cx="320" cy="50" r="60" />
          <line x1="0" y1="90" x2="400" y2="90" stroke="#5c5046" stroke-opacity="0.08" stroke-width="1" />
        </svg>
        <div class="cover-gradient" />
      </div>
      <div class="profile-body stacked-body">
        <div class="profile-main">
          <button type="button" class="avatar-clickable avatar-wrap" :disabled="uploadingAvatar" @click="fileInputRef?.click()">
            <v-avatar size="72" class="profile-avatar" elevation="2">
              <v-img v-if="user?.photo" :src="user.photo" cover />
              <span v-else class="text-h5">{{ (user?.name || 'U').charAt(0) }}</span>
            </v-avatar>
            <v-overlay :model-value="uploadingAvatar" contained scrim="rgba(255,255,255,0.7)" class="align-center justify-center" persistent>
              <v-progress-circular indeterminate size="32" />
            </v-overlay>
          </button>
          <div class="profile-info">
            <div v-if="editingName" class="d-flex flex-wrap align-center gap-2 mt-1">
              <v-text-field
                v-model="localName"
                density="compact"
                variant="outlined"
                hide-details
                class="profile-name-input"
                @keydown.enter="saveName"
                @keydown.escape="cancelEditName"
              />
              <v-btn size="small" color="primary" :loading="savingName" @click="saveName">保存</v-btn>
              <v-btn size="small" variant="text" :disabled="savingName" @click="cancelEditName">取消</v-btn>
              <p v-if="nameError" class="text-caption text-error">{{ nameError }}</p>
            </div>
            <div v-else class="d-flex align-center gap-1 flex-wrap">
              <h1 class="profile-name">{{ user?.name ?? '用户' }}</h1>
              <v-btn icon variant="text" size="x-small" @click="editingName = true">
                <v-icon size="16">mdi-pencil</v-icon>
              </v-btn>
            </div>
            <div class="profile-id">ID: {{ user?.id || '—' }}</div>
          </div>
        </div>
        <div class="profile-stats">
          <span class="stat-item"><strong>{{ stats.analyzed }}</strong> 条分析</span>
          <span class="stat-divider">|</span>
          <span class="stat-item"><strong>{{ stats.gallery }}</strong> 幅画廊</span>
          <span class="stat-divider">|</span>
          <span class="stat-item"><strong>{{ stats.collected ?? 0 }}</strong> 幅收藏</span>
        </div>
      </div>
    </template>

    <!-- sidebar: 竖长侧栏 -->
    <div v-else class="sidebar-inner">
      <div class="sidebar-bg" aria-hidden="true">
        <svg viewBox="0 0 280 600" preserveAspectRatio="xMinYMid slice">
          <defs>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#5c5046" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#6b5b4f" stop-opacity="0.08" />
            </linearGradient>
          </defs>
          <rect fill="url(#sg)" width="280" height="600" />
          <polygon fill="#2e2c2a" opacity="0.06" points="0,0 280,0 200,400 0,400" />
          <rect fill="#5c5046" opacity="0.06" x="20" y="40%" width="120" height="140" />
          <circle fill="#6b5b4f" opacity="0.08" cx="200" cy="30%" r="80" />
        </svg>
      </div>
      <div class="sidebar-content">
        <button type="button" class="avatar-clickable sidebar-avatar-wrap" :disabled="uploadingAvatar" @click="fileInputRef?.click()">
          <v-avatar size="96" class="sidebar-avatar" elevation="4">
            <v-img v-if="user?.photo" :src="user.photo" cover />
            <span v-else class="text-h4">{{ (user?.name || 'U').charAt(0) }}</span>
          </v-avatar>
          <v-overlay :model-value="uploadingAvatar" contained scrim="rgba(255,255,255,0.7)" class="align-center justify-center" persistent>
            <v-progress-circular indeterminate size="40" />
          </v-overlay>
        </button>
        <div v-if="editingName" class="sidebar-name-edit">
          <v-text-field
            v-model="localName"
            density="compact"
            variant="outlined"
            hide-details
            class="mb-2"
            @keydown.enter="saveName"
            @keydown.escape="cancelEditName"
          />
          <div class="d-flex gap-1">
            <v-btn size="small" color="primary" :loading="savingName" @click="saveName">保存</v-btn>
            <v-btn size="small" variant="text" :disabled="savingName" @click="cancelEditName">取消</v-btn>
          </div>
          <p v-if="nameError" class="text-caption text-error mt-1">{{ nameError }}</p>
        </div>
        <div v-else class="d-flex align-center justify-center gap-1">
          <h1 class="sidebar-name">{{ user?.name ?? '用户' }}</h1>
          <v-btn icon variant="text" size="x-small" @click="editingName = true">
            <v-icon size="16">mdi-pencil</v-icon>
          </v-btn>
        </div>
        <div class="sidebar-id">ID: {{ user?.id || '—' }}</div>
        <div class="sidebar-stats">
          <div class="stat-block">
            <span class="stat-num">{{ stats.analyzed }}</span>
            <span class="stat-label">分析记录</span>
          </div>
          <div class="stat-block">
            <span class="stat-num">{{ stats.gallery }}</span>
            <span class="stat-label">画廊作品</span>
          </div>
          <div class="stat-block">
            <span class="stat-num">{{ stats.collected ?? 0 }}</span>
            <span class="stat-label">我的收藏</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  user: { id: string; name: string; photo?: string } | null
  stats: { analyzed: number; gallery: number; collected?: number }
  variant: 'stacked' | 'sidebar'
}>()

const emit = defineEmits<{
  'avatar-success': [url: string]
  'update-name': [name: string]
}>()

const auth = useAuthing()
const fileInputRef = ref<HTMLInputElement | null>(null)
const uploadingAvatar = ref(false)
const editingName = ref(false)
const localName = ref('')
const savingName = ref(false)
const nameError = ref('')

watch(() => props.user?.name, (v) => { localName.value = v ?? '' }, { immediate: true })

async function saveName() {
  const name = localName.value.trim()
  if (!name || name === props.user?.name) {
    editingName.value = false
    return
  }
  nameError.value = ''
  savingName.value = true
  auth.setName(name)
  editingName.value = false
  try {
    await auth.updateProfile({ nickname: name })
  } catch {
    // 已通过 setName 更新展示
  } finally {
    savingName.value = false
  }
}

function cancelEditName() {
  localName.value = props.user?.name ?? ''
  editingName.value = false
  nameError.value = ''
}

function resizeImageToSquare(file: File, maxSize = 512): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      const cropSize = Math.min(img.width, img.height)
      const sx = (img.width - cropSize) / 2
      const sy = (img.height - cropSize) / 2
      const outSize = Math.min(cropSize, maxSize)
      const canvas = document.createElement('canvas')
      canvas.width = outSize
      canvas.height = outSize
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Canvas not supported'))
        return
      }
      ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, outSize, outSize)
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/jpeg', 0.9)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Image load failed'))
    }
    img.src = url
  })
}

async function onFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !file.type.startsWith('image/')) return
  input.value = ''
  uploadingAvatar.value = true
  try {
    const blob = await resizeImageToSquare(file)
    const token = await auth.getAccessToken()
    if (!token) throw new Error('请先登录')
    const formData = new FormData()
    formData.append('file', blob, 'avatar.jpg')
    const { url } = await $fetch<{ url: string }>('/api/avatar', {
      method: 'POST',
      body: formData,
      headers: { Authorization: `Bearer ${token}` },
    })
    useToast().success('头像已更新')
    emit('avatar-success', url)
  } catch (err) {
    const msg = (err as Error)?.message ?? '上传失败'
    useToast().error(msg)
  } finally {
    uploadingAvatar.value = false
  }
}
</script>

<style scoped>
/* ========== stacked (移动端) ========== */
.profile-header.variant-stacked {
  margin: -16px -16px 0;
  margin-bottom: 24px;
}

.cover {
  height: 140px;
  position: relative;
  overflow: hidden;
}

.cover-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, #faf9f7 95%);
  pointer-events: none;
}

.stacked-body {
  padding: 0 20px 16px;
  margin-top: -48px;
  position: relative;
  z-index: 1;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.avatar-clickable {
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  border-radius: 50%;
  position: relative;
}

.avatar-clickable:hover {
  opacity: 0.9;
}

.profile-avatar {
  flex-shrink: 0;
  border: 3px solid #faf9f7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.profile-name-input {
  max-width: 180px;
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #2e2c2a;
}

.profile-id {
  font-size: 0.8rem;
  color: rgba(46, 44, 42, 0.65);
}

.profile-stats {
  margin-top: 16px;
  padding: 12px 0;
  font-size: 0.95rem;
  color: rgba(46, 44, 42, 0.8);
}

.stat-item {
  margin: 0 4px;
}

.stat-item strong {
  color: #5c5046;
  font-weight: 600;
}

.stat-divider {
  color: rgba(46, 44, 42, 0.35);
  margin: 0 8px;
}

/* ========== sidebar (桌面端) ========== */
.profile-header.variant-sidebar {
  margin: 0;
  height: 100%;
  min-height: 400px;
}

.sidebar-inner {
  position: relative;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(46, 44, 42, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.sidebar-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sidebar-bg svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-content {
  position: relative;
  z-index: 1;
  padding: 28px 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sidebar-avatar-wrap {
  display: block;
  margin: 0 auto;
}

.sidebar-avatar {
  flex-shrink: 0;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.sidebar-name-edit {
  width: 100%;
  margin-top: 16px;
}

.sidebar-name {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 16px 0 4px;
  color: #2e2c2a;
}

.sidebar-id {
  font-size: 0.75rem;
  color: rgba(46, 44, 42, 0.6);
  margin-bottom: 20px;
}

.sidebar-stats {
  display: flex;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid rgba(46, 44, 42, 0.12);
  width: 100%;
  justify-content: center;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: #5c5046;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(46, 44, 42, 0.65);
}
</style>
