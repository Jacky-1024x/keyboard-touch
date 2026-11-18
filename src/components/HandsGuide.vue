<script setup lang="ts">
import HandShape from './HandShape.vue'
import { FINGER_COLORS, FINGER_NAMES, type Finger } from '@/core/keyboard-layout'

defineProps<{
  /** 需要高亮的手指 */
  active: Finger[]
}>()
</script>

<template>
  <div class="hands">
    <HandShape side="l" :active="active" />
    <HandShape side="r" :active="active" />
    <div class="caption">
      <template v-if="active.length">
        用 <b v-for="f in active" :key="f" :style="{ background: FINGER_COLORS[f] }">{{ FINGER_NAMES[f] }}</b>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hands {
  position: relative;
  display: flex;
  justify-content: center;
  gap: calc(var(--key) * 1.6);
}

.caption {
  position: absolute;
  left: 50%;
  top: calc(var(--key) * 0.5);
  transform: translateX(-50%);
  font-size: calc(var(--key) * 0.26);
  color: #475569;
  white-space: nowrap;
  display: flex;
  gap: 6px;
  align-items: center;
}

.caption b {
  padding: 2px 8px;
  border-radius: 999px;
  color: #1e293b;
}
</style>
