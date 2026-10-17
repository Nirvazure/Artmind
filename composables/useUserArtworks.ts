import { computed, onScopeDispose, ref, unref, watch, type ComputedRef, type Ref } from 'vue'
import type { Artwork } from '~/stores/artwork'
import { mapArtworkRow, artworkSelectQuery } from './useArtworkMapper'

export function useUserArtworks(
  userId: Ref<string | undefined> | ComputedRef<string | undefined>,
  enabled: Ref<boolean> | ComputedRef<boolean> = ref(true),
) {
  const supabase = useSupabaseClient()
  const myArtworks = ref<Artwork[]>([])
  const myCollectedArtworks = ref<Artwork[]>([])
  const loading = ref(false)
  const error = ref('')
  let requestSequence = 0
  onScopeDispose(() => {
    requestSequence += 1
  })

  async function fetchUserArtworks() {
    const sequence = ++requestSequence
    const id = unref(userId)
    error.value = ''
    myArtworks.value = []
    myCollectedArtworks.value = []
    if (!id || !unref(enabled)) {
      loading.value = false
      return
    }
    loading.value = true
    try {
      const { data: galleryData, error: galleryError } = await supabase
        .from('artworks')
        .select(artworkSelectQuery)
        .eq('user_id', id)
        .order('created_at', { ascending: false })
      if (galleryError) throw galleryError
      if (sequence !== requestSequence) return
      const nextArtworks = (galleryData ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )

      const { data: likesData, error: likesError } = await supabase
        .from('artwork_likes')
        .select('artwork_id')
        .eq('user_id', id)
      if (likesError) throw likesError
      if (sequence !== requestSequence) return
      const artworkIds = (likesData ?? []).map((l) => l.artwork_id)
      if (artworkIds.length === 0) {
        myArtworks.value = nextArtworks
        myCollectedArtworks.value = []
        return
      }
      const { data: collectedData, error: collectedError } = await supabase
        .from('artworks')
        .select(artworkSelectQuery)
        .in('id', artworkIds)
        .order('created_at', { ascending: false })
      if (collectedError) throw collectedError
      if (sequence !== requestSequence) return
      myArtworks.value = nextArtworks
      myCollectedArtworks.value = (collectedData ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )
    } catch (cause: unknown) {
      if (sequence !== requestSequence) return
      error.value = cause instanceof Error ? cause.message : '加载个人作品失败，请重试'
    } finally {
      if (sequence === requestSequence) loading.value = false
    }
  }

  watch([userId, enabled], fetchUserArtworks, { immediate: true })

  function updateArtwork(updated: Artwork) {
    const id = unref(userId)
    if (!id || !unref(enabled)) return
    myArtworks.value = myArtworks.value.map((item) => (item.id === updated.id ? updated : item))
    if (!updated.likes.includes(id)) {
      myCollectedArtworks.value = myCollectedArtworks.value.filter((item) => item.id !== updated.id)
    } else if (myCollectedArtworks.value.some((item) => item.id === updated.id)) {
      myCollectedArtworks.value = myCollectedArtworks.value.map((item) =>
        item.id === updated.id ? updated : item,
      )
    } else {
      myCollectedArtworks.value = [updated, ...myCollectedArtworks.value]
    }
  }

  const analyzedArtworks = computed(() => myArtworks.value.filter((item) => !!item.analysisResult))

  return {
    myArtworks,
    myCollectedArtworks,
    analyzedArtworks,
    loading,
    error,
    updateArtwork,
    refresh: fetchUserArtworks,
  }
}
