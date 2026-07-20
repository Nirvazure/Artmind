<template>
  <div class="user-page pa-4" :class="{ 'layout-desktop': isDesktop }">
    <div v-if="auth.loading.value || artworksLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!canView" class="text-center py-8">
      <p class="text-body1 text-medium-emphasis">暂不支持查看他人主页</p>
      <v-btn variant="text" color="primary" :to="'/'">返回首页</v-btn>
    </div>
    <div v-else class="user-content">
      <aside v-if="isDesktop" class="user-sidebar">
        <UserProfileHeader
          :user="auth.user.value"
          :stats="{
            analyzed: analyzedArtworks.length,
            gallery: myArtworks.length,
            collected: myCollectedArtworks.length,
          }"
          :variant="'sidebar'"
          @avatar-success="onAvatarSuccess"
        />
      </aside>
      <main class="user-main">
        <template v-if="!isDesktop">
          <UserProfileHeader
            :user="auth.user.value"
            :stats="{
              analyzed: analyzedArtworks.length,
              gallery: myArtworks.length,
              collected: myCollectedArtworks.length,
            }"
            :variant="'stacked'"
            @avatar-success="onAvatarSuccess"
          />
        </template>

        <v-card rounded="xl">
          <v-tabs v-model="activeTab" grow>
            <v-tab value="analyze">
              分析记录
              <span class="text-caption text-medium-emphasis ms-1"
                >({{ analyzedArtworks.length }} 条)</span
              >
            </v-tab>
            <v-tab value="gallery">
              我的画廊
              <span class="text-caption text-medium-emphasis ms-1"
                >({{ myArtworks.length }} 幅)</span
              >
            </v-tab>
            <v-tab value="collection">
              我的收藏
              <span class="text-caption text-medium-emphasis ms-1"
                >({{ myCollectedArtworks.length }} 幅)</span
              >
            </v-tab>
          </v-tabs>
          <v-divider />
          <v-window v-model="activeTab">
            <v-window-item value="analyze">
              <v-list v-if="analyzedArtworks.length" lines="two">
                <v-list-item
                  v-for="item in pagedAnalyzedArtworks"
                  :key="`log-${item.id}`"
                  :title="item.title || '未命名作品'"
                  :subtitle="item.style"
                  :to="`/${item.id}?analyse=true`"
                />
              </v-list>
              <v-card-text v-if="analyzedArtworks.length > analysisRecordsPerPage">
                <v-pagination
                  v-model="analysisRecordsPage"
                  :length="analysisRecordsPageCount"
                  density="comfortable"
                  rounded="circle"
                />
              </v-card-text>
              <v-card-text v-else-if="!analyzedArtworks.length" class="text-medium-emphasis">
                暂无分析记录
              </v-card-text>
            </v-window-item>
            <v-window-item value="gallery">
              <v-card-text>
                <div v-if="myArtworks.length" class="gallery-masonry">
                  <MasonryWall
                    :items="myArtworks"
                    :column-width="columnWidth"
                    :gap="16"
                    :ssr-columns="2"
                    :key-mapper="(item) => item.id"
                  >
                    <template #default="{ item }">
                      <UserGalleryCard :artwork="item" @updated="onGalleryArtworkUpdated" />
                    </template>
                  </MasonryWall>
                </div>
                <div v-else class="text-medium-emphasis">暂无已保存画作</div>
              </v-card-text>
            </v-window-item>
            <v-window-item value="collection">
              <v-card-text>
                <div v-if="myCollectedArtworks.length" class="gallery-masonry">
                  <MasonryWall
                    :items="myCollectedArtworks"
                    :column-width="columnWidth"
                    :gap="16"
                    :ssr-columns="2"
                    :key-mapper="(item) => item.id"
                  >
                    <template #default="{ item }">
                      <UserGalleryCard
                        :artwork="item"
                        :show-public-switch="false"
                        :show-visibility-badge="false"
                      />
                    </template>
                  </MasonryWall>
                </div>
                <div v-else class="text-medium-emphasis">暂无收藏</div>
              </v-card-text>
            </v-window-item>
          </v-window>
        </v-card>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { MasonryWall } from '@yeger/vue-masonry-wall'
import { getPageItems } from '~/utils/analysis-helpers'

definePageMeta({ layout: 'home' })

const route = useRoute()
const auth = useAuth()
const activeTab = ref<'analyze' | 'gallery' | 'collection'>('analyze')
const isDesktop = ref(false)
const columnWidth = ref(220)
const analysisRecordsPerPage = 10
const analysisRecordsPage = ref(1)

const userId = computed(() => auth.user.value?.id)
const {
  myArtworks,
  myCollectedArtworks,
  analyzedArtworks,
  loading: artworksLoading,
  refresh: refreshUserArtworks,
} = useUserArtworks(userId)

const analysisRecordsPageCount = computed(() =>
  Math.max(1, Math.ceil(analyzedArtworks.value.length / analysisRecordsPerPage)),
)
const pagedAnalyzedArtworks = computed(() =>
  getPageItems(analyzedArtworks.value, analysisRecordsPage.value, analysisRecordsPerPage),
)

watch(analysisRecordsPageCount, (count) => {
  if (analysisRecordsPage.value > count) analysisRecordsPage.value = count
})

watch(analyzedArtworks, () => {
  analysisRecordsPage.value = 1
})

function checkDesktop() {
  if (typeof window === 'undefined') return
  isDesktop.value = window.innerWidth >= 768
}

function updateColumnWidth() {
  if (typeof window === 'undefined') return
  const w = window.innerWidth
  if (w >= 1280) columnWidth.value = 240
  else if (w >= 960) columnWidth.value = 220
  else if (w >= 600) columnWidth.value = 200
  else columnWidth.value = 180
}

onMounted(async () => {
  checkDesktop()
  updateColumnWidth()
  window.addEventListener('resize', checkDesktop)
  window.addEventListener('resize', updateColumnWidth)
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkDesktop)
    window.removeEventListener('resize', updateColumnWidth)
  }
})

const canView = computed(() => {
  const targetId = route.params.id as string
  return !!auth.user.value?.id && targetId === auth.user.value.id
})

async function onAvatarSuccess(url: string) {
  auth.setPhoto(url)
  try {
    await auth.updateProfile({ photo: url })
    await refreshUserArtworks()
  } catch {
    // 已通过 setPhoto 更新展示
  }
}

function onGalleryArtworkUpdated(updated: import('~/stores/artwork').Artwork) {
  const idx = myArtworks.value.findIndex((a) => a.id === updated.id)
  if (idx !== -1) myArtworks.value[idx] = updated
}
</script>

<style scoped>
.user-content {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.user-page.layout-desktop .user-content {
  flex-direction: row;
  align-items: flex-start;
  gap: 24px;
}

.user-sidebar {
  flex-shrink: 0;
  width: 280px;
  position: sticky;
  top: 24px;
}

.user-main {
  flex: 1;
  min-width: 0;
}

.gallery-masonry {
  min-height: 80px;
}
</style>
