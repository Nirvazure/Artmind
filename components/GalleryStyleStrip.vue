<template>
  <div class="style-grid">
    <button v-for="style in styles" :key="style" type="button" class="style-pill"
      :class="{ active: modelValue === style, 'has-cover': !!styleCoverMap?.[style] }" @click="onClick(style)">
      <span v-if="styleCoverMap?.[style]" class="style-pill-bg"
        :style="{ backgroundImage: `url(${styleCoverMap[style]})` }" />
      <span v-if="styleCoverMap?.[style]" class="style-pill-overlay" />
      <span class="style-pill-text">{{ style }}</span>
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string | null
  styles: string[]
  styleCoverMap?: Record<string, string>
}>()

const styleCoverMap = computed(() => props.styleCoverMap ?? {})

const emit = defineEmits<{
  'update:modelValue': [value: string | null]
}>()

function clearSelection() {
  emit('update:modelValue', null)
}

function onClick(style: string) {
  if (props.modelValue === style) {
    emit('update:modelValue', null)
  } else {
    emit('update:modelValue', style)
  }
}
</script>

<style scoped>
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.style-pill {
  position: relative;
  width: 100%;
  aspect-ratio: 8 / 3;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  font-size: 1rem;
  font-weight: 500;
  border-radius: 12px;
  border: 1px solid rgba(var(--v-theme-on-surface), 0.18);
  color: rgb(var(--v-theme-on-surface));
  cursor: pointer;
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.style-pill:not(.has-cover) {
  background: linear-gradient(135deg, color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, transparent) 0%, color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent) 100%);
}

.style-pill-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
}

.style-pill-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.78) 0%, rgba(0, 0, 0, 0.35) 50%, rgba(0, 0, 0, 0.2) 100%);
  z-index: 1;
}

.style-pill-text {
  position: relative;
  z-index: 2;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 90%;
}

.style-pill.has-cover:not(.active) .style-pill-text {
  color: #fff;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.style-pill-all {
  background: linear-gradient(135deg, color-mix(in srgb, rgb(var(--v-theme-surface)) 94%, transparent) 0%, color-mix(in srgb, rgb(var(--v-theme-surface)) 88%, transparent) 100%);
}

.style-pill.has-cover:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.style-pill.active {
  background: rgb(var(--v-theme-primary));
  border-color: rgb(var(--v-theme-primary));
}

.style-pill.active .style-pill-bg,
.style-pill.active .style-pill-overlay {
  display: none;
}

.style-pill.active .style-pill-text {
  color: rgb(var(--v-theme-on-primary));
  text-shadow: none;
}
</style>
