<template>
  <div class="boot-splash">
    <div class="boot-content">
      <div class="boot-ring">
        <img src="/icon.png" alt="ArtMind" class="boot-logo" />
      </div>
      <h1 class="boot-title">ArtMind</h1>
      <p class="boot-subtitle">AI 绘画分析引擎</p>
      <p class="boot-caption">{{ caption }}</p>
      <div v-if="$slots.default" class="boot-extra">
        <slot />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
withDefaults(
  defineProps<{
    caption?: string
  }>(),
  {
    caption: '正在为你挑选一幅画…',
  },
)
</script>

<style scoped>
.boot-splash {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(165deg, #faf9f7 0%, #f3efe9 45%, #ebe4db 100%);
  color: #2e2c2a;
}

.boot-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 24px;
  text-align: center;
}

.boot-ring {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 8px;
}

.boot-ring::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 50%;
  border: 1px dashed rgba(201, 169, 98, 0.55);
  animation: ring-spin 8s linear infinite;
}

.boot-logo {
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.boot-title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  line-height: 1.1;
}

.boot-subtitle {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 400;
  opacity: 0.72;
  letter-spacing: 0.06em;
}

.boot-caption {
  margin: 8px 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  color: transparent;
  background: linear-gradient(
    90deg,
    rgba(92, 80, 70, 0.45) 0%,
    rgba(46, 44, 42, 0.92) 50%,
    rgba(92, 80, 70, 0.45) 100%
  );
  background-size: 200% 100%;
  background-clip: text;
  -webkit-background-clip: text;
  animation: caption-shimmer 2s linear infinite;
}

.boot-extra {
  margin-top: 8px;
}

.boot-extra :deep(a) {
  color: #5c5046;
  font-size: 0.95rem;
  font-weight: 600;
  text-decoration: none;
  border-bottom: 1px solid rgba(92, 80, 70, 0.35);
  transition: opacity 0.2s ease;
}

.boot-extra :deep(a:hover) {
  opacity: 0.75;
}

@keyframes ring-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes caption-shimmer {
  from {
    background-position: 200% 0;
  }
  to {
    background-position: -200% 0;
  }
}
</style>
