export interface AuthUser {
  id: string
  name: string
  photo?: string
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const supabaseUser = useSupabaseUser()
  const session = useSupabaseSession()
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  async function loadProfile() {
    const {
      data: { user: authUser },
      error,
    } = await supabase.auth.getUser()
    if (error || !authUser?.id) {
      user.value = null
      return
    }

    const { data } = await supabase
      .from('profiles')
      .select('display_name, avatar_url')
      .eq('id', authUser.id)
      .maybeSingle()

    const meta = authUser.user_metadata
    user.value = {
      id: authUser.id,
      name:
        data?.display_name ??
        meta?.full_name ??
        meta?.name ??
        meta?.user_name ??
        authUser.email?.split('@')[0] ??
        '用户',
      photo: data?.avatar_url ?? meta?.avatar_url ?? meta?.picture ?? undefined,
    }
  }

  if (import.meta.client) {
    watch(
      supabaseUser,
      async () => {
        loading.value = true
        try {
          await loadProfile()
        } finally {
          loading.value = false
        }
      },
      { immediate: true },
    )
  }

  const isAuthenticated = computed(() => !!user.value?.id)

  async function init() {
    if (import.meta.server) return
    loading.value = true
    try {
      await loadProfile()
    } catch {
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function login() {
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${origin}/auth/callback` },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
    user.value = null
    await navigateTo('/')
  }

  async function getAccessToken(): Promise<string | null> {
    if (session.value?.access_token) return session.value.access_token
    const { data } = await supabase.auth.getSession()
    return data.session?.access_token ?? null
  }

  function setPhoto(url: string) {
    if (user.value) user.value = { ...user.value, photo: url }
  }

  function setName(name: string) {
    if (user.value) user.value = { ...user.value, name }
  }

  async function updateProfile(updates: { photo?: string; nickname?: string }) {
    if (!user.value?.id) throw new Error('请先登录')
    const row: { avatar_url?: string; display_name?: string } = {}
    if (updates.photo !== undefined) row.avatar_url = updates.photo
    if (updates.nickname !== undefined) row.display_name = updates.nickname
    const { error } = await supabase.from('profiles').update(row).eq('id', user.value.id)
    if (error) throw error
    await loadProfile()
  }

  return {
    user,
    loading,
    isAuthenticated,
    init,
    login,
    logout,
    getAccessToken,
    updateProfile,
    setPhoto,
    setName,
  }
}
