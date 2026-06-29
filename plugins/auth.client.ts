import type { User } from '@supabase/supabase-js'
import type { AuthUser } from '~/composables/useAuth'

function buildAuthUser(
  authUser: User,
  profile: { display_name: string | null; avatar_url: string | null } | null,
): AuthUser {
  const meta = authUser.user_metadata as Record<string, string | undefined> | undefined
  return {
    id: authUser.id,
    name:
      profile?.display_name ??
      meta?.full_name ??
      meta?.name ??
      meta?.user_name ??
      authUser.email?.split('@')[0] ??
      '用户',
    photo: profile?.avatar_url ?? meta?.avatar_url ?? meta?.picture ?? undefined,
  }
}

export default defineNuxtPlugin({
  name: 'artmind-auth',
  dependsOn: ['supabase'],
  setup() {
    const supabase = useSupabaseClient()
    const user = useState<AuthUser | null>('auth-user', () => null)
    const loading = useState<boolean>('auth-loading', () => true)
    const syncedUserId = useState<string | null>('auth-synced-id', () => null)

    async function syncFromSession(sessionUser: User | null, force = false) {
      if (!sessionUser?.id) {
        syncedUserId.value = null
        user.value = null
        loading.value = false
        return
      }

      if (!force && syncedUserId.value === sessionUser.id && user.value?.id === sessionUser.id) {
        loading.value = false
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', sessionUser.id)
        .maybeSingle()

      syncedUserId.value = sessionUser.id
      user.value = buildAuthUser(sessionUser, profile)
      loading.value = false
    }

    supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      const nextId = sessionUser?.id ?? null
      if (nextId !== syncedUserId.value) {
        loading.value = true
      }

      void syncFromSession(sessionUser).catch(() => {
        user.value = null
        syncedUserId.value = null
        loading.value = false
      })
    })
  },
})
