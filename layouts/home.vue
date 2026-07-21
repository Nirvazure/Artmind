<template>
  <v-app :class="['home-layout', { 'layout-gallery': route.path.startsWith('/gallery') }]">
    <v-app-bar elevation="0" prominent :class="[appBarClass, 'app-bar-shell']">
      <img src="/icon.png" alt="ArtMind" class="appbar-logo-icon mr-2" />
      <div class="d-flex flex-column">
        <v-toolbar-title class="font-weight-bold"> ArtMind </v-toolbar-title>
        <span class="app-bar-subtitle"> AI 绘画分析引擎</span>
      </div>
      <v-spacer />
      <v-btn v-if="route.path.startsWith('/gallery')" :to="'/'" variant="text" class="text-none">
        Home
      </v-btn>
      <v-btn v-else :to="'/gallery'" variant="text" class="text-none"> Gallery </v-btn>
      <ClientOnly>
        <NuxtLink
          v-if="auth.user.value"
          :to="`/user/${auth.user.value.id}`"
          class="user-entry ml-2"
          aria-label="个人中心"
        >
          <v-avatar size="36" class="user-entry-avatar">
            <v-img
              v-if="auth.user.value?.photo"
              :src="auth.user.value.photo"
              :alt="auth.user.value.name"
              cover
            />
            <span v-else class="text-body2">{{ (auth.user.value?.name || 'U').charAt(0) }}</span>
          </v-avatar>
        </NuxtLink>
        <v-btn
          v-else-if="!auth.loading.value"
          variant="outlined"
          size="small"
          class="ml-2 text-none"
          to="/login"
        >
          登录
        </v-btn>
      </ClientOnly>
    </v-app-bar>
    <v-main :class="mainClass">
      <v-container v-if="!isHome" fluid>
        <slot />
      </v-container>
      <slot v-else />
    </v-main>
  </v-app>
</template>

<script setup lang="ts">
const route = useRoute()
const auth = useAuth()

const isArtworkDetail = computed(() => {
  if (route.path === '/' || route.path === '/gallery') return false
  const segments = route.path.split('/').filter(Boolean)
  return segments.length === 1
})
const isHome = computed(() => route.path === '/' || isArtworkDetail.value)
const mainClass = computed(() => (isHome.value ? 'pa-0 home-main' : 'default-main'))
const appBarClass = computed(() =>
  route.path === '/' || isArtworkDetail.value
    ? 'app-bar-ghost app-bar-home'
    : 'app-bar-ghost app-bar-default',
)
</script>

<style scoped>
.home-layout {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.home-main {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.home-main > * {
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.default-main {
  overflow-y: auto;
  flex: 1;
  min-height: 0;
  scrollbar-width: none;
}

.default-main::-webkit-scrollbar {
  display: none;
}

.app-bar-shell {
  flex-shrink: 0;
  z-index: 100;
}

.app-bar-ghost {
  background: transparent !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  box-shadow: none !important;
  border-bottom: 0 !important;
}

.app-bar-shell :deep(.v-toolbar__content) {
  padding-inline-start: 20px;
  padding-inline-end: 28px;
}

.appbar-logo-icon {
  margin-inline-start: 4px;
  width: 40px;
  height: 40px;
  object-fit: contain;
}

.app-bar-home :deep(.v-btn),
.app-bar-home :deep(.v-toolbar-title),
.app-bar-home .app-bar-subtitle {
  color: rgba(255, 255, 255, 0.94) !important;
}

.app-bar-default :deep(.v-btn),
.app-bar-default :deep(.v-toolbar-title),
.app-bar-default .app-bar-subtitle {
  color: rgba(16, 22, 30, 0.94) !important;
}

.app-bar-subtitle {
  font-size: 0.75rem;
  opacity: 0.82;
  line-height: 1.2;
}

.user-entry {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 50%;
  text-decoration: none;
  background: transparent;
}

.user-entry-avatar {
  flex: 0 0 auto;
}

.user-entry:hover {
  opacity: 0.92;
}

.user-entry:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 3px;
}

@media (max-width: 599px) {
  .home-layout {
    height: auto;
    min-height: 100vh;
    min-height: 100dvh;
  }

  .home-main {
    overflow-y: auto;
    overflow-x: hidden;
    -webkit-overflow-scrolling: touch;
    scrollbar-width: none;
  }

  .home-main::-webkit-scrollbar {
    display: none;
  }

  .home-main > * {
    overflow: visible;
  }

  .app-bar-shell {
    height: 56px !important;
  }

  .app-bar-shell :deep(.v-toolbar__content) {
    height: 56px !important;
    padding-inline-start: 12px;
    padding-inline-end: 12px;
  }

  .appbar-logo-icon {
    width: 30px;
    height: 30px;
  }

  .app-bar-shell :deep(.v-toolbar-title) {
    font-size: 1.05rem;
    line-height: 1;
  }

  .app-bar-shell :deep(.v-btn) {
    min-width: 0;
    padding-inline: 10px;
  }

  .app-bar-subtitle {
    display: none;
  }

  .user-entry {
    width: 40px;
    height: 40px;
  }
}

.layout-gallery {
  --gallery-bg: #faf9f7;
  --gallery-text: #2e2c2a;
}

.layout-gallery :deep(.app-bar-shell .v-btn),
.layout-gallery :deep(.app-bar-shell .v-toolbar-title),
.layout-gallery :deep(.app-bar-shell .app-bar-subtitle) {
  color: rgba(16, 22, 30, 0.94) !important;
}
</style>
