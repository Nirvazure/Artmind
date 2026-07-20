<template>
  <v-snackbar
    :model-value="toast.state.value.show"
    content-class="toast-snackbar-content"
    location="bottom"
    :timeout="3000"
    @update:model-value="(v: boolean) => !v && toast.close()"
  >
    <div class="toast-panel" :class="`toast-panel--${toast.state.value.type}`">
      <v-icon :icon="iconName" size="18" class="toast-icon" />
      <span class="toast-message">{{ toast.state.value.message }}</span>
    </div>
  </v-snackbar>
</template>

<script setup lang="ts">
const toast = useToast()

const iconName = computed(() => {
  if (toast.state.value.type === 'error') return 'mdi-alert-circle-outline'
  if (toast.state.value.type === 'success') return 'mdi-check-circle-outline'
  return 'mdi-information-outline'
})
</script>

<style scoped>
.toast-panel {
  display: flex;
  align-items: center;
  gap: 10px;
  max-width: min(520px, calc(100vw - 32px));
  padding: 12px 14px;
  border-radius: 12px;
  background: rgba(10, 14, 20, 0.78);
  color: #f4f7fb;
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 16px 36px -20px rgba(0, 0, 0, 0.65);
  backdrop-filter: blur(18px);
  -webkit-backdrop-filter: blur(18px);
}

.toast-panel::before {
  content: '';
  width: 3px;
  align-self: stretch;
  border-radius: 999px;
  background: #c9a962;
}

.toast-panel--error::before {
  background: #d86b5b;
}

.toast-panel--info::before {
  background: rgba(244, 247, 251, 0.68);
}

.toast-icon {
  flex-shrink: 0;
  color: #d8bd78;
}

.toast-panel--error .toast-icon {
  color: #f09a8c;
}

.toast-panel--info .toast-icon {
  color: rgba(244, 247, 251, 0.82);
}

.toast-message {
  min-width: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
</style>

<style>
.toast-snackbar-content {
  padding: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}
</style>
