<template>
  <v-dialog
    :model-value="modelValue"
    max-width="600"
    scrollable
    :aria-labelledby="titleId"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <v-card v-if="painter" class="painter-dialog" rounded="xl">
      <div class="painter-dialog-heading">
        <PainterPortrait
          :name="painter.displayName"
          :portrait-url="painter.portrait?.url"
          :size="72"
        />
        <div class="painter-dialog-heading-text">
          <p class="painter-caption">画家资料</p>
          <h2 :id="titleId">{{ painter.displayName }}</h2>
          <p class="painter-caption">{{ painter.era }} · {{ painter.style }}</p>
        </div>
        <v-btn
          icon
          size="small"
          variant="text"
          aria-label="关闭画家资料"
          @click="$emit('update:modelValue', false)"
        >
          <LucideIcon name="x" :size="20" />
        </v-btn>
      </div>
      <v-card-text class="painter-dialog-body">
        <p class="painter-bio">{{ painter.bio }}</p>
        <section class="painter-verification" aria-label="资料核验说明">
          <p class="painter-section-title">
            {{ painter.verified ? '资料已核验' : '资料待进一步确认' }}
          </p>
          <p>{{ painter.verificationNote }}</p>
          <p class="painter-caption">流派关联不代表画家的全部创作，也不能用于判定作品作者。</p>
        </section>
        <section aria-label="资料来源">
          <h3 class="painter-section-title">资料来源</h3>
          <ul class="painter-sources">
            <li v-for="source in painter.sources" :key="source.url">
              <a :href="source.url" target="_blank" rel="noopener noreferrer">
                {{ source.title }} ↗
              </a>
              <span class="painter-caption">{{ source.institution }}</span>
            </li>
          </ul>
          <p class="painter-caption">核验日期：{{ painter.verifiedAt }}</p>
        </section>
        <p v-if="painter.portrait" class="painter-caption painter-portrait-credit">
          肖像：
          <a :href="painter.portrait.source.url" target="_blank" rel="noopener noreferrer">
            {{ painter.portrait.source.institution }} · {{ painter.portrait.source.title }} ↗
          </a>
          <br />
          使用许可：{{ painter.portrait.license }}
          <br />
          署名：{{ painter.portrait.credit }}
        </p>
      </v-card-text>
      <v-card-actions class="painter-dialog-actions">
        <v-btn variant="tonal" rounded="pill" @click="$emit('update:modelValue', false)"
          >关闭</v-btn
        >
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { useId } from 'vue'
import type { PainterKnowledge } from '~/types/art-knowledge'

defineProps<{ modelValue: boolean; painter: PainterKnowledge | null }>()
defineEmits<{ 'update:modelValue': [value: boolean] }>()
const titleId = useId()
</script>

<style scoped>
.painter-dialog {
  padding: 8px;
}
.painter-dialog-heading {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 20px 12px;
}
.painter-dialog-heading-text {
  flex: 1;
  min-width: 0;
}
.painter-dialog-heading h2 {
  font-size: 1.35rem;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.painter-caption {
  margin: 4px 0 0;
  font-size: 0.78rem;
  opacity: 0.72;
  line-height: 1.7;
}
.painter-dialog-body {
  display: flex;
  flex-direction: column;
  gap: 24px;
}
.painter-bio {
  line-height: 1.9;
}
.painter-section-title {
  font-size: 0.85rem;
  font-weight: 600;
  margin: 0 0 8px;
}
.painter-verification {
  border-left: 2px solid #a88f54;
  padding-left: 14px;
  font-size: 0.85rem;
  line-height: 1.8;
}
.painter-sources {
  list-style: none;
  padding: 0;
  margin: 0 0 12px;
  display: grid;
  gap: 12px;
}
.painter-sources a,
.painter-portrait-credit a {
  color: inherit;
  text-underline-offset: 3px;
  overflow-wrap: anywhere;
}
.painter-sources a {
  font-size: 0.85rem;
}
.painter-sources span {
  display: block;
}
.painter-dialog-actions {
  justify-content: flex-end;
  padding: 8px 20px 16px;
}
@media (max-width: 599px) {
  .painter-dialog-heading {
    gap: 10px;
    padding: 16px 12px 8px;
  }
  .painter-dialog-heading h2 {
    font-size: 1.1rem;
  }
}
</style>
