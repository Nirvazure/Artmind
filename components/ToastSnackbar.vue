<template>
  <v-snackbar
    :model-value="toast.state.value.show"
    :color="toast.state.value.type === 'error' ? 'error' : toast.state.value.type === 'success' ? 'success' : 'surface'"
    location="bottom"
    variant="tonal"
    :timeout="3000"
    @update:model-value="(v: boolean) => !v && toast.close()"
  >
    {{ toast.state.value.message }}
  </v-snackbar>
</template>

<script setup lang="ts">
const toast = useToast()
</script>
