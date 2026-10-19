import type { User } from '@supabase/supabase-js'
import type { AuthUser } from '~/composables/useAuth'
import { githubAvatarUrl } from '../utils/github-avatar'

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
    photo:
      githubAvatarUrl(authUser) ??
      githubAvatarUrl({ user_metadata: { avatar_url: profile?.avatar_url } }) ??
      undefined,
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
    let authGeneration = 0

    async function syncFromSession(sessionUser: User | null, generation: number, force = false) {
      if (generation !== authGeneration) return
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

      if (generation !== authGeneration) return
      syncedUserId.value = sessionUser.id
      user.value = buildAuthUser(sessionUser, profile)
      loading.value = false

      const avatarUrl = user.value.photo ?? null
      if (profile && profile.avatar_url !== avatarUrl) {
        try {
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: avatarUrl })
            .eq('id', sessionUser.id)
          if (generation !== authGeneration) return
          if (error) console.warn('同步 GitHub 头像失败', error)
        } catch (error) {
          if (generation !== authGeneration) return
          console.warn('同步 GitHub 头像失败', error)
        }
      }
    }

    supabase.auth.onAuthStateChange((event, session) => {
      const generation = ++authGeneration
      const sessionUser = session?.user ?? null
      const nextId = sessionUser?.id ?? null
      if (nextId !== syncedUserId.value) {
        loading.value = true
      }

      // Run profile queries after the auth callback releases the session lock.
      setTimeout(() => {
        void syncFromSession(
          sessionUser,
          generation,
          event === 'SIGNED_IN' || event === 'USER_UPDATED',
        ).catch(() => {
          if (generation !== authGeneration) return
          user.value = sessionUser ? buildAuthUser(sessionUser, null) : null
          syncedUserId.value = sessionUser?.id ?? null
          loading.value = false
        })
      }, 0)
    })
  },
})
