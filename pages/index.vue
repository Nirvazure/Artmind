<template>
  <AppBootSplash :caption="caption">
    <NuxtLink v-if="showGalleryLink" to="/gallery">前往画廊</NuxtLink>
  </AppBootSplash>
</template>

<script setup lang="ts">
definePageMeta({ layout: false })

const router = useRouter()
const artworkStore = useArtworkStore()

const caption = ref('正在为你挑选一幅画…')
const showGalleryLink = ref(false)

onMounted(async () => {
  try {
    if (artworkStore.artworks.length === 0) {
      await artworkStore.fetchArtworks()
    }
    const list = artworkStore.artworks
    if (!list.length) {
      caption.value = '暂无作品，前往画廊看看'
      showGalleryLink.value = true
      return
    }
    const index = Math.floor(Math.random() * list.length)
    await router.replace(`/${list[index].id}`)
  } catch {
    caption.value = '加载失败，请稍后重试'
    showGalleryLink.value = true
  }
})
</script>
