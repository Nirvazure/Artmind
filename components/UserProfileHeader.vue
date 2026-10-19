<template>
  <div class="profile-header" :class="[`variant-${variant}`]">
    <template v-if="variant === 'stacked'">
      <div class="cover" aria-hidden="true">
        <svg class="cover-art" viewBox="0 0 400 140" preserveAspectRatio="xMidYMid slice">
          <rect fill="#5c5046" opacity="0.12" width="400" height="140" />
          <polygon fill="#6b5b4f" opacity="0.18" points="0,140 120,40 240,100 400,20 400,140" />
          <rect fill="#2e2c2a" opacity="0.08" x="0" y="60" width="180" height="80" />
          <circle fill="#5c5046" opacity="0.1" cx="320" cy="50" r="60" />
          <line
            x1="0"
            y1="90"
            x2="400"
            y2="90"
            stroke="#5c5046"
            stroke-opacity="0.08"
            stroke-width="1"
          />
        </svg>
        <div class="cover-gradient" />
      </div>
      <div class="profile-body stacked-body">
        <div class="profile-main">
          <div class="avatar-wrap">
            <v-avatar size="72" class="profile-avatar" elevation="2">
              <v-img v-if="user?.photo" :src="user.photo" cover />
              <span v-else class="text-h5">{{ (user?.name || 'U').charAt(0) }}</span>
            </v-avatar>
          </div>
          <div class="profile-info">
            <h1 class="profile-name">{{ user?.name ?? '用户' }}</h1>
          </div>
        </div>
        <div class="profile-stats">
          <span class="stat-item"
            ><strong>{{ stats.analyzed }}</strong> 条分析</span
          >
          <span class="stat-divider">|</span>
          <NuxtLink
            :to="{ path: `/user/${user?.id}`, query: { view: 'uploads' } }"
            class="stat-item stat-link"
            aria-label="查看我上传的画作"
          >
            <strong>{{ stats.gallery }}</strong> 幅上传
          </NuxtLink>
          <span class="stat-divider">|</span>
          <NuxtLink
            to="/gallery?collected=true"
            class="stat-item stat-link"
            aria-label="查看我的收藏"
          >
            <strong>{{ stats.collected ?? 0 }}</strong> 幅收藏
          </NuxtLink>
        </div>
        <v-btn
          block
          variant="tonal"
          prepend-icon="mdi-logout"
          class="logout-button stacked-logout"
          @click="auth.logout()"
        >
          退出登录
        </v-btn>
      </div>
    </template>

    <div v-else class="sidebar-inner">
      <div class="sidebar-bg" aria-hidden="true">
        <svg viewBox="0 0 280 600" preserveAspectRatio="xMinYMid slice">
          <defs>
            <linearGradient id="sg" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stop-color="#5c5046" stop-opacity="0.15" />
              <stop offset="100%" stop-color="#6b5b4f" stop-opacity="0.08" />
            </linearGradient>
          </defs>
          <rect fill="url(#sg)" width="280" height="600" />
          <polygon fill="#2e2c2a" opacity="0.06" points="0,0 280,0 200,400 0,400" />
          <rect fill="#5c5046" opacity="0.06" x="20" y="40%" width="120" height="140" />
          <circle fill="#6b5b4f" opacity="0.08" cx="200" cy="30%" r="80" />
        </svg>
      </div>
      <div class="sidebar-content">
        <div class="sidebar-avatar-wrap">
          <v-avatar size="96" class="sidebar-avatar" elevation="4">
            <v-img v-if="user?.photo" :src="user.photo" cover />
            <span v-else class="text-h4">{{ (user?.name || 'U').charAt(0) }}</span>
          </v-avatar>
        </div>
        <h1 class="sidebar-name">{{ user?.name ?? '用户' }}</h1>
        <div class="sidebar-stats">
          <div class="stat-block">
            <span class="stat-num">{{ stats.analyzed }}</span>
            <span class="stat-label">分析记录</span>
          </div>
          <NuxtLink
            :to="{ path: `/user/${user?.id}`, query: { view: 'uploads' } }"
            class="stat-block stat-link"
            aria-label="查看我上传的画作"
          >
            <span class="stat-num">{{ stats.gallery }}</span>
            <span class="stat-label">上传画作</span>
          </NuxtLink>
          <NuxtLink
            to="/gallery?collected=true"
            class="stat-block stat-link"
            aria-label="查看我的收藏"
          >
            <span class="stat-num">{{ stats.collected ?? 0 }}</span>
            <span class="stat-label">我的收藏</span>
          </NuxtLink>
        </div>
        <v-btn
          block
          variant="tonal"
          prepend-icon="mdi-logout"
          class="logout-button sidebar-logout"
          @click="auth.logout()"
        >
          退出登录
        </v-btn>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  user: { id: string; name: string; photo?: string } | null
  stats: { analyzed: number; gallery: number; collected?: number }
  variant: 'stacked' | 'sidebar'
}>()

const auth = useAuth()
</script>

<style scoped>
.profile-header.variant-stacked {
  margin: -16px -16px 0;
  margin-bottom: 24px;
}

.cover {
  height: 140px;
  position: relative;
  overflow: hidden;
}

.cover-art {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cover-gradient {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, transparent 40%, #faf9f7 95%);
  pointer-events: none;
}

.stacked-body {
  padding: 0 20px 16px;
  margin-top: -48px;
  position: relative;
  z-index: 1;
}

.profile-main {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex-wrap: wrap;
}

.profile-avatar {
  flex-shrink: 0;
  border: 3px solid #faf9f7;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
}

.profile-info {
  flex: 1;
  min-width: 0;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 4px;
  color: #2e2c2a;
}

.profile-stats {
  margin-top: 16px;
  padding: 12px 0;
  font-size: 0.95rem;
  color: rgba(46, 44, 42, 0.8);
}

.stat-item {
  margin: 0 4px;
}

.stat-item strong {
  color: #5c5046;
  font-weight: 600;
}

.stat-link {
  min-height: 44px;
  min-width: 44px;
  border-radius: 6px;
  color: inherit;
  text-decoration: none;
}

.stat-item.stat-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  vertical-align: middle;
}

.stat-link:hover {
  background: rgba(92, 80, 70, 0.08);
}

.stat-link:focus-visible {
  outline: 2px solid #5c5046;
  outline-offset: 3px;
}

.stat-divider {
  color: rgba(46, 44, 42, 0.35);
  margin: 0 8px;
}

.stacked-logout {
  margin-top: 12px;
}

.profile-header.variant-sidebar {
  margin: 0;
  height: 100%;
  min-height: 400px;
}

.sidebar-inner {
  position: relative;
  height: 100%;
  min-height: 400px;
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid rgba(46, 44, 42, 0.1);
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
}

.sidebar-bg {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.sidebar-bg svg {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.sidebar-content {
  position: relative;
  z-index: 1;
  padding: 28px 24px 14px;
  height: 100%;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.sidebar-avatar-wrap {
  display: block;
  margin: 0 auto;
}

.sidebar-avatar {
  flex-shrink: 0;
  border: 4px solid rgba(255, 255, 255, 0.9);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.sidebar-name {
  font-size: 1.35rem;
  font-weight: 600;
  margin: 16px 0 4px;
  color: #2e2c2a;
}

.sidebar-stats {
  display: flex;
  gap: 24px;
  padding: 20px 0;
  border-top: 1px solid rgba(46, 44, 42, 0.12);
  width: 100%;
  justify-content: center;
}

.stat-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-num {
  font-size: 1.5rem;
  font-weight: 700;
  color: #5c5046;
  line-height: 1.2;
}

.stat-label {
  font-size: 0.8rem;
  color: rgba(46, 44, 42, 0.65);
}

.logout-button {
  color: #5c5046;
  background: rgba(92, 80, 70, 0.08);
  border: 1px solid rgba(92, 80, 70, 0.12);
  box-shadow: none;
}

.sidebar-logout {
  margin-top: auto;
}
</style>
