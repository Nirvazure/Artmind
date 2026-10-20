<template>
  <v-avatar :size="size" class="painter-portrait">
    <img
      v-if="portraitUrl && !failed"
      :src="portraitUrl"
      :alt="`${name}肖像`"
      loading="lazy"
      @error="failed = true"
    />
    <span v-else aria-hidden="true">{{ painterInitial(name) }}</span>
  </v-avatar>
</template>

<script setup lang="ts">
import { painterInitial } from '~/utils/painter-avatar'

const props = withDefaults(defineProps<{ name: string; portraitUrl?: string; size?: number }>(), {
  portraitUrl: '',
  size: 40,
})
const failed = ref(false)
watch(
  () => props.portraitUrl,
  () => {
    failed.value = false
  },
)
</script>

<style scoped>
.painter-portrait {
  flex-shrink: 0;
  background: #344052;
  color: #f4f7fb;
  border: 1px solid rgba(201, 169, 98, 0.4);
  font-weight: 600;
}
.painter-portrait img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}
</style>
