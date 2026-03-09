<template>
  <div class="style-ring-chart">
    <ClientOnly>
      <Doughnut :data="chartData" :options="options" />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'
import { Doughnut } from 'vue-chartjs'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps<{
  styles: { name: string; confidence: number }[]
}>()

const CHART_COLORS = [
  'rgba(201, 169, 98, 0.95)',
  'rgba(255, 215, 140, 0.85)',
  'rgba(255, 255, 255, 0.6)',
]

const chartData = computed(() => {
  const items = props.styles.slice(0, 3)
  if (items.length === 0) {
    return { labels: [], datasets: [{ data: [], backgroundColor: [] }] }
  }
  const sum = items.reduce((a, s) => a + s.confidence, 0)
  const normalized = sum > 0
    ? items.map((s) => Math.round((s.confidence / sum) * 100))
    : items.map(() => 33)
  return {
    labels: items.map((s) => s.name),
    datasets: [
      {
        data: normalized,
        backgroundColor: CHART_COLORS.slice(0, items.length),
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
    ],
  }
})

const options = {
  responsive: true,
  maintainAspectRatio: false,
  cutout: '70%',
  plugins: {
    legend: { display: false },
    tooltip: {
      callbacks: {
        label: (ctx: { label: string; raw: number }) => `${ctx.label}: ${ctx.raw}%`,
      },
    },
  },
}
</script>

<style scoped>
.style-ring-chart {
  width: 132px;
  height: 132px;
}
</style>
