<template>
  <v-dialog
    :model-value="modelValue"
    class="save-dialog-overlay"
    content-class="save-dialog-content"
    max-width="640"
    scrollable
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card class="save-dialog glass-panel" elevation="0">
      <v-card-title class="save-dialog-title">
        {{ isExistingOwned ? '更新作品信息' : '确认并保存' }}
      </v-card-title>
      <v-card-text class="save-dialog-body">
        <div class="field-group">
          <label class="field-label">作品标题</label>
          <v-text-field
            v-model="draft.title"
            variant="plain"
            density="compact"
            hide-details
            class="field-input"
            placeholder="可留空"
          />
        </div>

        <div class="field-group">
          <label class="field-label">真实流派</label>
          <v-autocomplete
            v-model="draft.selectedStyle"
            :items="styleSelectItems"
            item-title="title"
            item-value="value"
            variant="plain"
            density="compact"
            hide-details
            class="field-input"
            :loading="modelStylesLoading"
            placeholder="搜索流派"
          />
          <div v-if="showAiRecommendation" class="ai-recommendation">
            <p class="ai-recommendation-title">AI 推荐流派：{{ normalizedAiRecommendedStyle }}</p>
            <p class="ai-recommendation-note">当前默认值保留作品已保存流派</p>
          </div>
        </div>

        <div class="field-group">
          <label class="field-label">真实画家</label>
          <v-combobox
            v-model="draft.editablePainters"
            :items="painterItems"
            variant="plain"
            density="compact"
            hide-details
            class="field-input"
            chips
            closable-chips
            multiple
            clearable
            placeholder="可新增或删除"
          />
        </div>
      </v-card-text>
      <v-card-actions class="save-dialog-actions">
        <v-btn
          variant="text"
          rounded="pill"
          class="save-dialog-cancel"
          @click="$emit('update:modelValue', false)"
        >
          取消
        </v-btn>
        <v-spacer />
        <v-btn
          rounded="pill"
          variant="flat"
          class="save-dialog-confirm"
          :loading="saving || updating"
          :disabled="saving || updating"
          @click="onConfirm"
        >
          {{ confirmLabel }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { getDefaultPaintersForStyle, getPainterOptionsByStyle } from '~/utils/painter-options'

interface SaveDraft {
  title: string
  selectedStyle: string
  editablePainters: string[]
}

const props = withDefaults(
  defineProps<{
    modelValue: boolean
    title: string
    selectedStyle: string
    editablePainters: string[]
    styleSelectItems: { title: string; value: string }[]
    paintersCatalog: { name: string; style: string }[]
    modelStylesLoading: boolean
    aiRecommendedStyle?: string
    saving?: boolean
    updating?: boolean
    isExistingOwned?: boolean
  }>(),
  {
    aiRecommendedStyle: '',
    saving: false,
    updating: false,
    isExistingOwned: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [draft: SaveDraft]
}>()

const draft = reactive<SaveDraft>({
  title: '',
  selectedStyle: '',
  editablePainters: [],
})
let syncingFromProps = false

const painterItems = computed(() =>
  getPainterOptionsByStyle(draft.selectedStyle, props.paintersCatalog),
)

const confirmLabel = computed(() => {
  if (props.saving) return '正在入库...'
  if (props.updating) return '更新中...'
  return props.isExistingOwned ? '确认更新' : '确认保存'
})

const normalizedAiRecommendedStyle = computed(() => props.aiRecommendedStyle?.trim() ?? '')
const showAiRecommendation = computed(() => {
  if (!props.isExistingOwned) return false
  if (!normalizedAiRecommendedStyle.value) return false
  return normalizedAiRecommendedStyle.value !== draft.selectedStyle.trim()
})

function syncDraftFromProps() {
  syncingFromProps = true
  draft.title = props.title
  draft.selectedStyle = props.selectedStyle
  draft.editablePainters = [...props.editablePainters]
  queueMicrotask(() => {
    syncingFromProps = false
  })
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) syncDraftFromProps()
  },
)

watch(
  () => draft.selectedStyle,
  (style, oldStyle) => {
    if (!props.modelValue || syncingFromProps || style === oldStyle) return
    draft.editablePainters = getDefaultPaintersForStyle(style, props.paintersCatalog)
  },
)

function onConfirm() {
  emit('confirm', {
    title: draft.title,
    selectedStyle: draft.selectedStyle,
    editablePainters: [...draft.editablePainters],
  })
}
</script>

<style scoped>
.save-dialog.glass-panel {
  --ui-text: #f4f7fb;
  --ui-muted: rgba(244, 247, 251, 0.78);
  --ui-panel-bg: rgba(10, 14, 20, 0.44);
  --ui-panel-border: rgba(255, 255, 255, 0.28);
  background: var(--ui-panel-bg) !important;
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  overflow: hidden;
}

.save-dialog.glass-panel::before {
  z-index: 1;
}

.save-dialog-title,
.save-dialog-body,
.save-dialog-actions {
  position: relative;
  z-index: 2;
}

.save-dialog-title {
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-weight: 600;
  padding: 20px 24px 8px;
  color: var(--ui-text);
}

.save-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 8px 24px 4px;
}

.save-dialog-actions {
  padding: 12px 24px 24px;
}

.save-dialog-cancel {
  color: var(--ui-muted);
  text-transform: none;
  letter-spacing: 0.02em;
}

.save-dialog-cancel:hover {
  color: var(--ui-text);
}

.save-dialog-confirm {
  background: #c9a962 !important;
  color: #1a1510 !important;
  text-transform: none;
  letter-spacing: 0.02em;
}

.save-dialog-confirm:hover {
  background: #d4b56e !important;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-label {
  font-size: 0.65rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.ai-recommendation {
  margin-top: 2px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(201, 169, 98, 0.12);
  border: 1px solid rgba(201, 169, 98, 0.28);
}

.ai-recommendation-title,
.ai-recommendation-note {
  margin: 0;
}

.ai-recommendation-title {
  color: var(--ui-text);
  font-size: 0.82rem;
  font-weight: 600;
}

.ai-recommendation-note {
  margin-top: 4px;
  color: var(--ui-muted);
  font-size: 0.72rem;
}

.field-input :deep(.v-field) {
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0;
  padding-inline: 0;
  color: var(--ui-text);
}

.field-input :deep(.v-field__input) {
  color: var(--ui-text);
}

.field-input :deep(.v-field__outline) {
  display: none;
}
</style>

<style>
.save-dialog-overlay .v-overlay__scrim {
  background: rgba(0, 0, 0, 0.38);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.save-dialog-content {
  background: transparent;
  box-shadow: none;
  border-radius: 20px;
  overflow: hidden;
}
</style>
