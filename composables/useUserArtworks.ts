import type { Artwork } from '~/stores/artwork'
import { mapArtworkRow, artworkSelectQuery } from '~/composables/useArtworkMapper'

export function useUserArtworks(userId: Ref<string | undefined> | ComputedRef<string | undefined>) {
  const supabase = useSupabaseClient()
  const myArtworks = ref<Artwork[]>([])
  const myCollectedArtworks = ref<Artwork[]>([])
  const loading = ref(false)

  async function fetchUserArtworks() {
    const id = unref(userId)
    if (!id) {
      myArtworks.value = []
      myCollectedArtworks.value = []
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
      myArtworks.value = (galleryData ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )

      const { data: likesData, error: likesError } = await supabase
        .from('artwork_likes')
        .select('artwork_id')
        .eq('user_id', id)
      if (likesError) throw likesError
      const artworkIds = (likesData ?? []).map((l) => l.artwork_id)
      if (artworkIds.length === 0) {
        myCollectedArtworks.value = []
        return
      }
      const { data: collectedData, error: collectedError } = await supabase
        .from('artworks')
        .select(artworkSelectQuery)
        .in('id', artworkIds)
        .order('created_at', { ascending: false })
      if (collectedError) throw collectedError
      myCollectedArtworks.value = (collectedData ?? []).map((row) =>
        mapArtworkRow(row as Parameters<typeof mapArtworkRow>[0]),
      )
    } finally {
      loading.value = false
    }
  }

  watch(userId, fetchUserArtworks, { immediate: true })

  const analyzedArtworks = computed(() => myArtworks.value.filter((item) => !!item.analysisResult))

  return {
    myArtworks,
    myCollectedArtworks,
    analyzedArtworks,
    loading,
    refresh: fetchUserArtworks,
  }
}
