<template>
  <v-container fluid class="user-page">
    <div v-if="auth.loading.value || artworksLoading" class="text-center py-8">
      <v-progress-circular indeterminate color="primary" />
    </div>
    <div v-else-if="!canView" class="text-center py-8">
      <p class="text-body1 text-medium-emphasis">暂不支持查看他人主页</p>
      <v-btn variant="text" color="primary" :to="'/'">返回首页</v-btn>
    </div>
    <div v-else class="user-content">
      <aside class="user-sidebar">
        <UserProfileHeader
          :user="auth.user.value"
          :stats="profileStats"
          variant="sidebar"
          @avatar-success="onAvatarSuccess"
        />
      </aside>
      <main class="user-main">
        <div class="user-profile-mobile">
          <UserProfileHeader
            :user="auth.user.value"
            :stats="profileStats"
            variant="stacked"
            @avatar-success="onAvatarSuccess"
          />
        </div>

        <v-alert v-if="artworksError" type="error" variant="tonal" class="mb-4">
          {{ artworksError }}
          <v-btn variant="text" size="small" @click="refreshUserArtworks">重试</v-btn>
        </v-alert>

        <v-btn-toggle
          v-model="profileView"
          mandatory
          rounded="pill"
          class="profile-view-toggle mb-6"
          aria-label="个人中心内容"
        >
          <v-btn value="records" rounded="pill">
            <LucideIcon name="history" :size="18" />分析记录
          </v-btn>
          <v-btn value="uploads" rounded="pill">
            <LucideIcon name="images" :size="18" />我上传的画作
          </v-btn>
        </v-btn-toggle>

        <section v-if="profileView === 'uploads'" aria-label="我上传的画作">
          <GalleryArtworkGrid
            :artworks="myArtworks"
            manage-own
            empty-text="还没有上传画作，分析画作后即可保存到这里。"
            @updated="updateArtwork"
            @collection-change="updateArtwork"
          />
        </section>
        <v-card v-else rounded="xl" class="analysis-records">
          <div class="records-heading">
            <h2><LucideIcon name="history" :size="20" />分析记录</h2>
            <span>{{ analyzedArtworks.length }} 条</span>
          </div>
          <v-divider />
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
        </v-card>
      </main>
    </div>
  </v-container>
</template>

<script setup lang="ts">
import { getPageItems } from '~/utils/analysis-helpers'

definePageMeta({ layout: 'home' })

const route = useRoute()
const router = useRouter()
const auth = useAuth()
const profileView = computed({
  get: () => (route.query.view === 'uploads' ? 'uploads' : 'records'),
  set: (value: string) => {
    void router.replace({
      query: { ...route.query, view: value === 'uploads' ? 'uploads' : undefined },
    })
  },
})
const analysisRecordsPerPage = 10
const analysisRecordsPage = ref(1)
const canView = computed(() => {
  const targetId = route.params.id as string
  return !!auth.user.value?.id && targetId === auth.user.value.id
})
const userId = computed(() => (canView.value ? auth.user.value?.id : undefined))
const {
  myArtworks,
  myCollectedArtworks,
  analyzedArtworks,
  loading: artworksLoading,
  error: artworksError,
  refresh: refreshUserArtworks,
  updateArtwork,
} = useUserArtworks(userId)
const profileStats = computed(() => ({
  analyzed: analyzedArtworks.value.length,
  gallery: myArtworks.value.length,
  collected: myCollectedArtworks.value.length,
}))

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

async function onAvatarSuccess(url: string) {
  auth.setPhoto(url)
  try {
    await auth.updateProfile({ photo: url })
    await refreshUserArtworks()
  } catch {
    // 已通过 setPhoto 更新展示
  }
}
</script>

<style scoped>
.profile-view-toggle {
  height: 44px;
  background: rgba(var(--v-theme-primary), 0.06);
}

.profile-view-toggle :deep(.v-btn__content) {
  gap: 8px;
}

.profile-view-toggle :deep(.v-btn--active) {
  background: rgb(var(--v-theme-primary));
  color: rgb(var(--v-theme-on-primary));
}

.user-page {
  width: 100%;
  padding: clamp(12px, 2vw, 28px);
}

.user-content {
  display: grid;
  grid-template-columns: 280px minmax(0, 1fr);
  align-items: start;
  gap: 28px;
}

.user-sidebar {
  position: sticky;
  top: 24px;
}

.user-main {
  min-width: 0;
}

.user-profile-mobile {
  display: none;
}

.analysis-records {
  border: 1px solid rgba(46, 44, 42, 0.1);
  box-shadow: none;
}

.records-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 20px;
}

.records-heading h2 {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 1.1rem;
  font-weight: 600;
}

.records-heading > span {
  font-size: 0.85rem;
  color: rgba(46, 44, 42, 0.65);
}

@media (max-width: 959px) {
  .user-content {
    grid-template-columns: 240px minmax(0, 1fr);
    gap: 20px;
  }
}

@media (max-width: 767px) {
  .user-content {
    display: block;
  }

  .user-sidebar {
    display: none;
  }

  .user-profile-mobile {
    display: block;
  }
}
</style>
