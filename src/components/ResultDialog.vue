<script setup lang="ts">
import { computed } from 'vue'
import { starsOf } from '@/stores/records'

const props = defineProps<{
  title?: string
  speed: number
  speedUnit: string
  accuracy: number
  durationMs: number
  /** 游戏得分，传入时展示 */
  score?: number
}>()

defineEmits<{ (e: 'again'): void; (e: 'back'): void }>()

const stars = computed(() => starsOf(props.accuracy, props.speed, props.speedUnit))
const praise = computed(() => ['继续加油！', '很棒！', '太厉害了！'][stars.value - 1])
const seconds = computed(() => Math.round(props.durationMs / 1000))
</script>

<template>
  <div class="mask">
    <div class="dialog">
      <div class="stars">
        <span v-for="i in 3" :key="i" :class="{ on: i <= stars }">★</span>
      </div>
      <h2>{{ title ?? praise }}</h2>
      <div class="grid">
        <div v-if="score !== undefined"><b>{{ score }}</b><span>得分</span></div>
        <div><b>{{ speed }}</b><span>{{ speedUnit }}</span></div>
        <div><b>{{ accuracy }}%</b><span>正确率</span></div>
        <div><b>{{ seconds }}s</b><span>用时</span></div>
      </div>
      <div class="actions">
        <button class="btn" @click="$emit('back')">返回</button>
        <button class="btn primary" @click="$emit('again')">再来一次（Enter）</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  background: rgb(15 23 42 / 0.45);
  display: grid;
  place-items: center;
  z-index: 50;
  animation: fade 0.2s;
}

.dialog {
  width: min(480px, 90vw);
  padding: 28px 32px;
  background: #fff;
  border-radius: 24px;
  text-align: center;
  box-shadow: 0 20px 60px rgb(0 0 0 / 0.25);
  animation: pop 0.3s cubic-bezier(0.2, 1.4, 0.4, 1);
}

.stars {
  font-size: 56px;
  letter-spacing: 8px;
  color: #e2e8f0;
}

.stars .on {
  color: #fbbf24;
  text-shadow: 0 2px 8px rgb(251 191 36 / 0.5);
}

h2 {
  margin: 4px 0 20px;
  font-size: 26px;
}

.grid {
  display: flex;
  justify-content: space-around;
  margin-bottom: 24px;
}

.grid div {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.grid b {
  font-size: 28px;
  color: #2563eb;
}

.grid span {
  font-size: 13px;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 12px;
  justify-content: center;
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@keyframes pop {
  from {
    transform: scale(0.7);
    opacity: 0;
  }
}
</style>
