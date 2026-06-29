export interface AuthUser {
  id: string
  name: string
  photo?: string
}

export function useAuth() {
  const supabase = useSupabaseClient()
  const session = useSupabaseSession()
  const user = useState<AuthUser | null>('auth-user', () => null)
  const loading = useState<boolean>('auth-loading', () => true)

  const isAuthenticated = computed(() => !!user.value?.id)

  async function login() {
    const origin = window.location.origin
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: { redirectTo: `${origin}/auth/callback` },
    })
  }

  async function logout() {
    await supabase.auth.signOut()
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
    if (updates.nickname !== undefined) setName(updates.nickname)
    if (updates.photo !== undefined) setPhoto(updates.photo)
  }

  return {
    user,
    loading,
    isAuthenticated,
    login,
    logout,
    getAccessToken,
    updateProfile,
    setPhoto,
    setName,
  }
}
