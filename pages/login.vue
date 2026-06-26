<template>
  <div class="login-page d-flex flex-column align-center justify-center pa-8">
    <v-card max-width="400" width="100%" rounded="xl" class="pa-6">
      <h1 class="text-h5 font-weight-bold mb-2 text-center">
        登录 ArtMind
      </h1>
      <p class="text-body2 text-medium-emphasis text-center mb-6">
        使用 GitHub 账号登录，保存作品、收藏与分析记录
      </p>
      <v-btn
        block
        color="primary"
        size="large"
        class="text-none"
        :loading="loading"
        prepend-icon="mdi-github"
        @click="onLogin"
      >
        使用 GitHub 登录
      </v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const auth = useAuth()
const loading = ref(false)

async function onLogin() {
  loading.value = true
  try {
    await auth.login()
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 60vh;
}
</style>
