<template>
  <div class="user-page pa-4" :class="{ 'layout-desktop': isDesktop }">
    <div v-if="auth.loading.value" class="text-center py-8">
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
          :stats="{ analyzed: analyzedArtworks.length, gallery: myArtworks.length, collected: myCollectedArtworks.length }"
          :variant="'sidebar'"
          @avatar-success="onAvatarSuccess"
        />
      </aside>
      <main class="user-main">
        <template v-if="!isDesktop">
          <UserProfileHeader
            :user="auth.user.value"
            :stats="{ analyzed: analyzedArtworks.length, gallery: myArtworks.length, collected: myCollectedArtworks.length }"
            :variant="'stacked'"
            @avatar-success="onAvatarSuccess"
          />
        </template>

        <v-card rounded="xl">
          <v-tabs v-model="activeTab" grow>
            <v-tab value="analyze">
              分析记录
              <span class="text-caption text-medium-emphasis ms-1">({{ analyzedArtworks.length }} 条)</span>
            </v-tab>
            <v-tab value="gallery">
              我的画廊
              <span class="text-caption text-medium-emphasis ms-1">({{ myArtworks.length }} 幅)</span>
            </v-tab>
            <v-tab value="collection">
              我的收藏
              <span class="text-caption text-medium-emphasis ms-1">({{ myCollectedArtworks.length }} 幅)</span>
            </v-tab>
          </v-tabs>
          <v-divider />
          <v-window v-model="activeTab">
            <v-window-item value="analyze">
              <v-alert
                type="info"
                variant="tonal"
                density="comfortable"
                class="ma-4 mb-0"
              >
                临时上传图片（temp）会在 1 天内自动删除，请及时保存到画廊。
              </v-alert>
              <v-list v-if="analyzedArtworks.length" lines="two">
                <v-list-item
                  v-for="item in analyzedArtworks"
                  :key="`log-${item.id}`"
                  :title="item.title || '未命名作品'"
                  :subtitle="item.style"
                  :to="`/${item.id}?analyse=true`"
                />
              </v-list>
              <v-card-text v-else class="text-medium-emphasis">
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
                      <NuxtLink :to="`/${item.id}`" class="gallery-card-link">
                        <div
                          class="gallery-card-image"
                          :style="{
                            aspectRatio:
                              item.imageWidth && item.imageHeight
                                ? `${item.imageWidth / item.imageHeight}`
                                : '4/3',
                          }"
                        >
                          <v-img :src="item.imageUrl" :alt="item.title" cover />
                        </div>
                        <div class="gallery-card-title">{{ item.title || '未命名作品' }}</div>
                      </NuxtLink>
                    </template>
                  </MasonryWall>
                </div>
                <div v-else class="text-medium-emphasis">
                  暂无已保存画作
                </div>
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
                      <NuxtLink :to="`/${item.id}`" class="gallery-card-link">
                        <div
                          class="gallery-card-image"
                          :style="{
                            aspectRatio:
                              item.imageWidth && item.imageHeight
                                ? `${item.imageWidth / item.imageHeight}`
                                : '4/3',
                          }"
                        >
                          <v-img :src="item.imageUrl" :alt="item.title" cover />
                        </div>
                        <div class="gallery-card-title">{{ item.title || '未命名作品' }}</div>
                      </NuxtLink>
                    </template>
                  </MasonryWall>
                </div>
                <div v-else class="text-medium-emphasis">
                  暂无收藏
                </div>
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

definePageMeta({ layout: 'home' })

const route = useRoute()
const auth = useAuthing()
const artworkStore = useArtworkStore()
const activeTab = ref<'analyze' | 'gallery' | 'collection'>('analyze')
const isDesktop = ref(false)
const columnWidth = ref(220)

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
  if (!auth.user.value) await auth.init()
  if (!artworkStore.artworks.length) await artworkStore.fetchArtworks()
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

const myArtworks = computed(() =>
  artworkStore.artworks.filter((item) => item.userId === auth.user.value?.id)
)

const analyzedArtworks = computed(() =>
  myArtworks.value.filter((item) => !!item.analysisResult)
)

const myCollectedArtworks = computed(() =>
  artworkStore.artworks.filter((a) => a.likes.includes(auth.user.value?.id ?? ''))
)

const canView = computed(() => {
  const targetId = route.params.id as string
  return !!auth.user.value?.id && targetId === auth.user.value.id
})

async function onAvatarSuccess(url: string) {
  auth.setPhoto(url)
  try {
    await auth.updateProfile({ photo: url })
  } catch {
    // 已通过 setPhoto 更新展示，Authing 若不支持 updateProfile 则仅本地生效
  }
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

.gallery-card-link {
  display: block;
  text-decoration: none;
  color: inherit;
  border-radius: 12px;
  overflow: hidden;
  background: color-mix(in srgb, rgb(var(--v-theme-surface)) 90%, transparent);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.gallery-card-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

.gallery-card-image {
  overflow: hidden;
  display: block;
}

.gallery-card-image :deep(img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gallery-card-title {
  padding: 12px 14px;
  font-size: 0.9rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
