<template>
  <div class="glass-section painter-cards-section">
    <h3 class="glass-title glass-title-sub">画家推测</h3>
    <div class="painters-cards">
      <div
        v-for="(p, i) in painters.slice(0, 3)"
        :key="i"
        class="painter-card"
        :class="{ champion: i === 0 }"
      >
        <span class="painter-rank">{{ i + 1 }}</span>
        <v-avatar
          :size="i === 0 ? 48 : 40"
          color="primary"
          variant="tonal"
          class="painter-card-avatar"
        >
          <span class="avatar-text">{{ (p || '—').trim().charAt(0) }}</span>
        </v-avatar>
        <span class="painter-card-name">{{ p || '—' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  painters: string[]
}>()
</script>

<style scoped>
.painter-cards-section {
  margin-bottom: 8px;
}

.glass-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin: 0 0 10px;
}

.glass-title-sub {
  font-weight: 600;
  color: var(--ui-muted, rgba(244, 247, 251, 0.78));
}

.painters-cards {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 12px;
}

.painter-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 14px 16px;
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 12px;
  min-width: 100px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.painter-card.champion {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(255, 255, 255, 0.2);
}

.painter-rank {
  position: absolute;
  top: 6px;
  right: 8px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(201, 169, 98, 0.9);
  color: #0d0d0d;
  font-size: 0.7rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.painter-card-avatar {
  flex-shrink: 0;
}

.painter-card-name {
  font-size: 0.9rem;
  font-weight: 600;
  margin-top: 8px;
}

.avatar-text {
  font-size: 1em;
  font-weight: 600;
}
</style>
