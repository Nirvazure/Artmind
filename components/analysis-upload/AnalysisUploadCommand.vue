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

@media (min-width: 600px) and (max-width: 1360px) {
  .upload-command {
    gap: 8px;
    padding: 8px 10px;
    border-radius: 12px;
  }

  .cmd-btn {
    padding: 7px 11px;
    font-size: 0.76rem;
  }

  .cmd-btn--primary {
    min-width: 84px;
  }

  .cmd-center {
    gap: 6px;
    padding-inline: 7px;
  }

  .cmd-thumb {
    width: 24px !important;
    height: 24px !important;
  }

  .cmd-filename {
    font-size: 0.76rem;
    max-width: 12ch;
  }
}

@media (max-width: 599px) {
  .upload-command {
    display: contents;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    color: var(--ui-text, #f4f7fb);
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  .cmd-center {
    display: none;
  }

  .cmd-thumb {
    display: none;
  }

  .cmd-filename {
    max-width: min(82vw, 320px);
    color: rgba(244, 247, 251, 0.86);
    font-size: 1.1rem;
    font-weight: 600;
    text-align: center;
  }

  .cmd-btn--ghost,
  .cmd-btn--primary {
    width: min(78%, 320px);
    min-height: 44px;
    padding: 10px 18px;
    border-radius: 999px;
    font-size: 1rem;
  }

  .cmd-btn--primary {
    order: 2;
    flex: 0 0 auto;
    box-shadow: 0 12px 24px -18px rgba(0, 0, 0, 0.54);
  }

  .cmd-btn--ghost {
    display: none;
  }

  .cmd-btn:disabled {
    opacity: 0.62;
  }

  .cmd-btn--primary:disabled {
    background: linear-gradient(90deg, rgba(232, 213, 163, 0.42), rgba(246, 242, 231, 0.56));
    color: rgba(26, 21, 16, 0.44);
  }
}
</style>
