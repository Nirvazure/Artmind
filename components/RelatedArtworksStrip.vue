<template>
  <div
    v-if="items.length > 0"
    class="related-strip"
    :class="{ 'related-strip--panel': variant === 'panel' }"
  >
    <p class="strip-heading">同流派 · {{ style }}</p>
    <div class="strip-scroll">
      <NuxtLink v-for="item in items" :key="item.id" :to="`/${item.id}`" class="strip-thumb">
        <v-img :src="item.imageUrl" :alt="item.title" cover class="thumb-img" />
        <span v-if="item.title" class="thumb-title">{{ item.title }}</span>
      </NuxtLink>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Artwork } from '~/stores/artwork'

const props = withDefaults(
  defineProps<{
    currentId: string
    style: string
    artworks: Artwork[]
    limit?: number
    variant?: 'stage' | 'panel'
  }>(),
  {
    limit: 6,
    variant: 'stage',
  },
)

const items = computed(() =>
  props.artworks
    .filter((a) => a.id !== props.currentId && a.style === props.style)
    .slice(0, props.limit),
)
</script>

<style scoped>
.related-strip {
  width: 100%;
  max-width: var(--art-stage-width, 960px);
  margin-top: 8px;
}

.related-strip--panel {
  max-width: none;
  margin-top: 0;
  padding: 16px 0;
  border-top: 1px solid var(--ui-divider, rgba(255, 255, 255, 0.12));
  border-bottom: 1px solid var(--ui-divider, rgba(255, 255, 255, 0.12));
  animation: hero-in 0.4s ease-out 0.24s both;
}

.strip-heading {
  margin: 0 0 10px;
  font-size: 0.72rem;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--ui-muted, rgba(244, 247, 251, 0.78));
}

.strip-scroll {
  display: flex;
  gap: 10px;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  padding-bottom: 4px;
}

.strip-scroll::-webkit-scrollbar {
  display: none;
}

.strip-thumb {
  flex: 0 0 auto;
  width: 100px;
  scroll-snap-align: start;
  text-decoration: none;
  color: var(--ui-text, #f4f7fb);
}

.thumb-img {
  width: 100px;
  height: 72px;
  border-radius: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  transition:
    transform 0.2s ease,
    box-shadow 0.2s ease;
}

.strip-thumb:hover .thumb-img {
  transform: scale(1.04);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.thumb-title {
  display: block;
  margin-top: 6px;
  font-size: 0.72rem;
  opacity: 0.85;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (min-width: 600px) and (max-width: 1360px) {
  .related-strip--panel {
    padding: 12px 0;
  }

  .strip-heading {
    margin-bottom: 8px;
    font-size: 0.68rem;
    letter-spacing: 0.1em;
  }

  .strip-scroll {
    gap: 8px;
    padding-bottom: 2px;
  }

  .strip-thumb {
    width: 76px;
  }

  .thumb-img {
    width: 76px;
    height: 54px;
    border-radius: 7px;
  }

  .related-strip--panel .thumb-title {
    display: none;
  }
}

@media (min-width: 600px) and (max-width: 839px) {
  .related-strip--panel {
    display: none;
  }
}

@media (max-width: 599px) {
  .related-strip--panel {
    padding: 14px 0;
    border-top-color: rgba(33, 29, 23, 0.12);
    border-bottom-color: rgba(33, 29, 23, 0.12);
  }

  .strip-heading {
    font-weight: 700;
    color: rgba(33, 29, 23, 0.64);
  }

  .strip-scroll {
    gap: 8px;
    padding-bottom: 2px;
  }

  .strip-thumb {
    width: 82px;
    color: #211d17;
  }

  .thumb-img {
    width: 82px;
    height: 62px;
    border-radius: 7px;
    border-color: rgba(33, 29, 23, 0.14);
    box-shadow: 0 8px 16px -14px rgba(0, 0, 0, 0.44);
  }

  .thumb-title {
    color: var(--ui-muted, rgba(33, 29, 23, 0.68));
  }
}
</style>
