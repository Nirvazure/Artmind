<template>
  <div class="redirect-page">
    <v-progress-circular indeterminate color="primary" />
  </div>
</template>

<script setup lang="ts">
definePageMeta({ layout: 'home' })

const router = useRouter()
const artworkStore = useArtworkStore()

onMounted(async () => {
  try {
    if (artworkStore.artworks.length === 0) {
      await artworkStore.fetchArtworks()
    }
    const list = artworkStore.artworks
    if (!list.length) return
    const index = Math.floor(Math.random() * list.length)
    await router.replace(`/${list[index].id}`)
  } catch {
    // Keep empty state if data loading fails.
  }
})
</script>

<style scoped>
.redirect-page {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
