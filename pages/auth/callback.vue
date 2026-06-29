<template>
  <div class="callback-page d-flex flex-column align-center justify-center pa-8">
    <v-progress-circular v-if="loading" indeterminate size="48" color="primary" />
    <p v-else class="text-body1">
      {{ message }}
    </p>
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const supabase = useSupabaseClient()
const auth = useAuth()
const loading = ref(true)
const message = ref('处理登录中…')

async function waitForAuthReady(timeoutMs = 5000): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (!auth.loading.value) return !!auth.user.value
    await new Promise((resolve) => setTimeout(resolve, 50))
  }
  return !!auth.user.value
}

onMounted(async () => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session && typeof route.query.code === 'string') {
      const { error } = await supabase.auth.exchangeCodeForSession(route.query.code)
      if (error) throw error
    }

    const ok = await waitForAuthReady()
    if (!ok) {
      message.value = '未获取到登录信息，请重新登录'
      return
    }

    message.value = '登录成功，正在跳转…'
    await nextTick()
    await router.replace('/')
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
