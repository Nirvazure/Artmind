<template>
  <div class="painter-grid">
    <article
      v-for="painter in painters"
      :key="painter.name"
      class="painter-pill"
    >
        <v-avatar size="56" class="painter-avatar">
          <v-img :src="avatarUrl(painter.name)" cover />
        </v-avatar>
        <div class="painter-meta">
          <p class="painter-name">
            {{ painter.name }}
            <v-icon v-if="painter.verified !== false" icon="mdi-check-decagram" size="16" class="painter-verified" />
          </p>
          <p class="painter-style">{{ painter.style }}</p>
        </div>
    </article>
  </div>
</template>

<script setup lang="ts">
interface PainterItem {
  name: string
  style: string
  era?: string
  bio?: string
  verified?: boolean
}

const { painters } = defineProps<{
  painters: PainterItem[]
}>()

function avatarUrl(name: string) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=2f3a4a&color=fff&size=112`
}
</script>

<style scoped>
.painter-grid {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

@media (min-width: 960px) {
  .painter-grid {
    grid-template-columns: repeat(6, 1fr);
  }
}

@media (min-width: 600px) and (max-width: 959px) {
  .painter-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

@media (max-width: 599px) {
  .painter-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

.painter-pill {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  min-width: 88px;
  border-radius: 14px;
  padding: 12px 10px;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.12);
}

.painter-avatar {
  flex-shrink: 0;
}

.painter-meta {
  min-width: 0;
  text-align: center;
}

.painter-name {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.painter-verified {
  flex-shrink: 0;
  opacity: 0.9;
}

.painter-style {
  margin: 2px 0 0;
  font-size: 0.7rem;
  opacity: 0.72;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
