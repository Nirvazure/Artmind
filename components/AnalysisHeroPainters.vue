<template>
  <div v-if="displayPainters.length > 0" class="hero-painters">
    <div class="hero-painters-head">
      <p class="hero-painters-eyebrow">可能相关画家</p>
      <p class="hero-painters-disclaimer">基于流派关联推测 · 非人脸识别</p>
    </div>

    <div class="hero-painters-row">
      <div class="hero-painters-primary">
        <v-avatar :size="52" class="hero-painter-avatar hero-painter-avatar--primary">
          <span class="avatar-initial">{{ painterInitial(primaryPainter) }}</span>
        </v-avatar>
        <div class="hero-painter-meta">
          <span class="hero-painter-name">{{ primaryPainter }}</span>
          <span class="hero-painter-badge">最可能</span>
        </div>
      </div>

      <template v-if="otherPainters.length">
        <v-divider vertical class="hero-painters-divider" />
        <div class="hero-painters-others">
          <div class="hero-painters-scroll">
            <div v-for="name in otherPainters" :key="name" class="hero-painter-item">
              <v-avatar :size="36" class="hero-painter-avatar">
                <span class="avatar-initial avatar-initial--sm">{{ painterInitial(name) }}</span>
              </v-avatar>
              <span class="hero-painter-item-name">{{ name }}</span>
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PainterCatalogItem } from '~/composables/usePainterDisplay'
import { usePainterDisplay } from '~/composables/usePainterDisplay'
import { painterInitial } from '~/utils/painter-avatar'

const props = withDefaults(
  defineProps<{
    painters?: string[]
    styleName?: string
    paintersCatalog?: PainterCatalogItem[]
  }>(),
  {
    painters: () => [],
    styleName: '',
    paintersCatalog: () => [],
  },
)

const paintersRef = computed(() => props.painters)
const styleNameRef = computed(() => props.styleName)
const catalogRef = computed(() => props.paintersCatalog)

const displayPainters = usePainterDisplay(paintersRef, styleNameRef, catalogRef)

const primaryPainter = computed(() => displayPainters.value[0] ?? '')
const otherPainters = computed(() => displayPainters.value.slice(1))
</script>

<style scoped>
.hero-painters {
  margin-top: 0;
  padding: 16px 0;
  border-top: 1px solid var(--ui-divider, rgba(255, 255, 255, 0.12));
  animation: hero-in 0.4s ease-out 0.2s both;
}

.hero-painters-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.hero-painters-eyebrow {
  margin: 0;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-muted);
}

.hero-painters-disclaimer {
  margin: 0;
  font-size: 0.68rem;
  color: var(--ui-muted);
  opacity: 0.75;
  text-align: right;
  flex-shrink: 0;
}

.hero-painters-row {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}

.hero-painters-primary {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-shrink: 0;
}

.hero-painters-divider {
  align-self: stretch;
  min-height: 56px;
  border-color: var(--ui-divider, rgba(255, 255, 255, 0.12));
  opacity: 1;
}

.hero-painters-others {
  flex: 1;
  min-width: 0;
}

.hero-painter-avatar {
  flex-shrink: 0;
  background: linear-gradient(145deg, rgba(58, 69, 86, 0.95), rgba(36, 44, 58, 0.98));
  border: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--ui-text, #f4f7fb);
}

.hero-painter-avatar--primary {
  border: 2px solid rgba(201, 169, 98, 0.55);
  box-shadow:
    0 0 0 1px rgba(255, 255, 255, 0.08),
    0 8px 20px -10px rgba(201, 169, 98, 0.35);
}

.avatar-initial {
  font-size: 1.15rem;
  font-weight: 600;
  line-height: 1;
}

.avatar-initial--sm {
  font-size: 0.82rem;
}

.hero-painter-meta {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.hero-painter-name {
  font-size: 1.05rem;
  font-weight: 600;
  line-height: 1.2;
}

.hero-painter-badge {
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.62rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(201, 169, 98, 0.95);
  background: rgba(201, 169, 98, 0.12);
  border: 1px solid rgba(201, 169, 98, 0.28);
}

.hero-painters-scroll {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 2px;
}

.hero-painters-scroll::-webkit-scrollbar {
  display: none;
}

.hero-painter-item {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  width: 56px;
  scroll-snap-align: start;
}

.hero-painter-item-name {
  width: 100%;
  font-size: 0.68rem;
  line-height: 1.25;
  text-align: center;
  color: var(--ui-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

@media (max-width: 599px) {
  .hero-painters-head {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }

  .hero-painters-disclaimer {
    text-align: left;
  }

  .hero-painters-row {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }

  .hero-painters-divider {
    display: none;
  }

  .hero-painters-others {
    padding-top: 12px;
    border-top: 1px solid var(--ui-divider, rgba(255, 255, 255, 0.12));
  }
}
</style>
