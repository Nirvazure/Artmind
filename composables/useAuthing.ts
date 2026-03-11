export function useAuthing() {
  const { $authing } = useNuxtApp()
  const user = useState<{ id: string; name: string; photo?: string } | null>('authing-user', () => null)
  const loading = useState<boolean>('authing-loading', () => true)

  async function init(opts?: { fromCallback?: boolean }) {
    if (import.meta.server) return
    loading.value = true
    user.value = null
    try {
      if ($authing.isRedirectCallback() && !opts?.fromCallback) {
        await $authing.handleRedirectCallback()
      }
      const state = await $authing.getLoginState()
      if (state?.accessToken) {
        const info = await $authing.getUserInfo({ accessToken: state.accessToken })
        if (info && !('apiCode' in info)) {
          const u = info as { userId?: string; sub?: string; id?: string; name?: string; nickname?: string; username?: string; photo?: string; picture?: string }
          user.value = {
            id: u.userId ?? u.sub ?? u.id ?? '',
            name: u.name ?? u.nickname ?? u.username ?? '用户',
            photo: u.photo ?? u.picture,
          }
        }
      }
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  const isAuthenticated = computed(() => !!user.value?.id)

  function login() {
    $authing.loginWithRedirect()
  }

  function logout() {
    $authing.logoutWithRedirect()
  }

  async function getAccessToken(): Promise<string | null> {
    try {
      const state = await $authing.getLoginState()
      return state?.accessToken ?? null
    } catch {
      return null
    }
  }

  function setPhoto(url: string) {
    if (user.value) {
      user.value = { ...user.value, photo: url }
    }
  }

  function setName(name: string) {
    if (user.value) {
      user.value = { ...user.value, name }
    }
  }

  async function updateProfile(updates: { photo?: string; nickname?: string }) {
    const token = await getAccessToken()
    if (!token) throw new Error('请先登录')
    await $fetch('/api/user/profile', {
      method: 'PUT',
      body: updates,
      headers: { Authorization: `Bearer ${token}` },
    })
    await init()
  }

  return { user, loading, isAuthenticated, init, login, logout, getAccessToken, updateProfile, setPhoto, setName }
}
