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

/** 等待 Supabase 客户端（detectSessionInUrl）完成 code 兑换 */
async function waitForAuthUser(timeoutMs = 4000): Promise<boolean> {
  const start = Date.now()
  while (Date.now() - start < timeoutMs) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (user) return true
    await new Promise((resolve) => setTimeout(resolve, 150))
  }
  return false
}

onMounted(async () => {
  try {
    let authenticated = await waitForAuthUser()

    // 自动兑换未生效时，再手动 exchange（仅当 URL 仍带 code 且无 session）
    if (!authenticated && typeof route.query.code === 'string') {
      const { error } = await supabase.auth.exchangeCodeForSession(route.query.code)
      if (error) {
        const {
          data: { user },
        } = await supabase.auth.getUser()
        authenticated = !!user
        if (!authenticated) throw error
      } else {
        authenticated = true
      }
    }

    if (!authenticated) {
      message.value = '未获取到登录信息，请重新登录'
      return
    }

    await auth.init()
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
