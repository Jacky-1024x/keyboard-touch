<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  speed: number
  speedUnit: string
  accuracy: number
  elapsedMs: number
  /** 0~1 */
  progress: number
}>()

const time = computed(() => {
  const s = Math.floor(props.elapsedMs / 1000)
  return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
})
</script>

<template>
  <div class="stats">
    <div class="item"><span class="v">{{ time }}</span><span class="k">⏱ 用时</span></div>
    <div class="item"><span class="v">{{ speed }}</span><span class="k">🚀 {{ speedUnit }}</span></div>
    <div class="item"><span class="v">{{ accuracy }}%</span><span class="k">🎯 正确率</span></div>
    <div class="progress">
      <div class="bar" :style="{ width: `${Math.round(progress * 100)}%` }" />
      <span>{{ Math.round(progress * 100) }}%</span>
    </div>
  </div>
</template>

<style scoped>
.stats {
  display: flex;
  align-items: center;
  gap: 24px;
  padding: 0 4px;
}

.item {
  display: flex;
  align-items: baseline;
  gap: 6px;
}

.v {
  font-size: 22px;
  font-weight: 800;
  color: #1e293b;
  font-variant-numeric: tabular-nums;
}

.k {
  font-size: 13px;
  color: #64748b;
}

.progress {
  flex: 1;
  position: relative;
  height: 14px;
  border-radius: 999px;
  background: #e2e8f0;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: linear-gradient(90deg, #60a5fa, #34d399);
  transition: width 0.2s;
}

.progress span {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  color: #334155;
}
</style>
