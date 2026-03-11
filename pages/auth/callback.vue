<template>
  <div class="callback-page d-flex flex-column align-center justify-center pa-8">
    <v-progress-circular
      v-if="loading"
      indeterminate
      size="48"
      color="primary"
    />
    <p v-else class="text-body1">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const { $authing } = useNuxtApp()
const router = useRouter()
const auth = useAuthing()
const loading = ref(true)
const message = ref('处理登录中…')

onMounted(async () => {
  try {
    if ($authing.isRedirectCallback()) {
      await $authing.handleRedirectCallback()
      await auth.init()
      message.value = '登录成功，正在跳转…'
      await nextTick()
      router.replace('/')
    } else {
      message.value = '未检测到登录回调，正在返回首页…'
      router.replace('/')
    }
  } catch (e) {
    console.error('Auth callback error:', e)
    message.value = '登录失败，请重试'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.callback-page {
  min-height: 60vh;
}
</style>
