<template>
  <div class="upload-command glass-panel">
    <button
      type="button"
      class="cmd-btn cmd-btn--ghost"
      :disabled="loading"
      @click="$emit('upload')"
    >
      ↑ 更换图片
    </button>
    <div class="cmd-center">
      <v-avatar v-if="previewUrl" :size="28" rounded="lg" class="cmd-thumb">
        <v-img :src="previewUrl" cover />
      </v-avatar>
      <span class="cmd-filename">{{ centerLabel }}</span>
    </div>
    <button
      type="button"
      class="cmd-btn cmd-btn--primary"
      :disabled="loading || !canAnalyze"
      @click="$emit('analyze')"
    >
      <span v-if="phase === 'analyzing'" class="cmd-spinner" />
      {{ ctaLabel }}
    </button>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisUploadProps } from './types'

const props = defineProps<AnalysisUploadProps>()

defineEmits<{
  upload: []
  analyze: []
}>()

const centerLabel = computed(() => {
  if (props.phase === 'analyzing') return '分析进行中…'
  if (props.fileName) return props.fileName
  if (props.previewUrl) return '当前作品'
  return '尚未选择图片'
})

const ctaLabel = computed(() => {
  if (props.phase === 'analyzing') return '分析中'
  if (props.phase === 'resolved') return '重新分析 →'
  return '分析 →'
})
</script>

<style scoped>
.upload-command {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border-radius: 14px;
}

.cmd-btn {
  flex-shrink: 0;
  padding: 8px 14px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-family: inherit;
  cursor: pointer;
  transition:
    background 0.2s ease,
    transform 0.2s ease;
}

.cmd-btn--ghost {
  border: 1px solid rgba(255, 255, 255, 0.2);
  background: transparent;
  color: var(--ui-text, #f4f7fb);
}

.cmd-btn--ghost:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.08);
}

.cmd-btn--primary {
  border: none;
  background: linear-gradient(90deg, #c9a962, #e8d5a3);
  color: #1a1510;
  font-weight: 600;
  min-width: 96px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.cmd-btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
}

.cmd-btn:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.cmd-center {
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 8px;
  border-left: 1px solid rgba(255, 255, 255, 0.12);
  border-right: 1px solid rgba(255, 255, 255, 0.12);
}

.cmd-thumb {
  flex-shrink: 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.cmd-filename {
  font-size: 0.82rem;
  color: var(--ui-muted, rgba(244, 247, 251, 0.78));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.cmd-spinner {
  width: 14px;
  height: 14px;
  border: 2px solid rgba(26, 21, 16, 0.25);
  border-top-color: #1a1510;
  border-radius: 50%;
  animation: cmd-spin 0.7s linear infinite;
}

@keyframes cmd-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 599px) {
  .upload-command {
    flex-wrap: wrap;
  }

  .cmd-center {
    order: -1;
    flex: 1 1 100%;
    border: none;
    padding: 4px 0 8px;
  }

  .cmd-btn--ghost {
    flex: 1;
  }

  .cmd-btn--primary {
    flex: 1;
  }
}
</style>
