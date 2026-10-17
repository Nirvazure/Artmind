<template>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="lucide-icon"
  >
    <component
      :is="node[0]"
      v-for="(node, index) in lucideIcons[name]"
      :key="index"
      v-bind="node[1]"
    />
  </svg>
</template>

<script setup lang="ts">
import { lucideIcons } from '~/utils/lucide-icons'

withDefaults(defineProps<{ name: keyof typeof lucideIcons; size?: number }>(), { size: 20 })
</script>

<style scoped>
.lucide-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
