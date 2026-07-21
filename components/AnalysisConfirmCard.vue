<template>
  <div class="confirm-card">
    <v-btn
      v-if="showSaveToGallery"
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
      v-if="showUpdateArtwork"
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
    showSaveToGallery?: boolean
    showUpdateArtwork?: boolean
    updating?: boolean
  }>(),
  {
    showSaveToGallery: false,
    showUpdateArtwork: false,
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

@media (max-width: 599px) {
  .confirm-card {
    padding-top: 12px;
  }

  .save-btn {
    min-height: 46px;
    border-radius: 12px !important;
    font-size: 0.95rem;
    font-weight: 700;
    background: linear-gradient(180deg, #d6bd79, #a88f54) !important;
    color: #17130e !important;
    box-shadow: 0 10px 18px -16px rgba(0, 0, 0, 0.5);
  }
}
</style>
