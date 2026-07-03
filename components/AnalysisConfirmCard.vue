<template>
  <div class="confirm-card">
    <v-btn
      v-if="!isExistingOwned"
      color="primary"
      rounded="pill"
      block
      class="save-btn"
      :disabled="!canSaveToGallery"
      @click="$emit('openSaveDialog')"
    >
      保存到我的画廊
    </v-btn>

    <v-btn
      v-else
      color="primary"
      rounded="pill"
      block
      class="save-btn"
      :disabled="updating"
      @click="$emit('openSaveDialog')"
    >
      更新作品
    </v-btn>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    canSaveToGallery: boolean
    isExistingOwned?: boolean
    updating?: boolean
  }>(),
  {
    isExistingOwned: false,
    updating: false,
  },
)

defineEmits<{
  openSaveDialog: []
}>()
</script>

<style scoped>
.confirm-card {
  padding-top: 8px;
}

.save-btn {
  text-transform: none;
  letter-spacing: 0.02em;
}
</style>
