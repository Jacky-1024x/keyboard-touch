<script setup lang="ts">
import { FINGER_COLORS, type Finger } from '@/core/keyboard-layout'

const props = defineProps<{
  side: 'l' | 'r'
  active: Finger[]
}>()

interface FingerShape {
  x: number
  y: number
  h: number
}

/** 左手形状（从小指到食指），右手整体镜像 */
const SHAPES: FingerShape[] = [
  { x: 18, y: 62, h: 80 },
  { x: 56, y: 32, h: 110 },
  { x: 96, y: 18, h: 124 },
  { x: 136, y: 36, h: 106 },
]
const W = 220
const FINGERS: Record<'l' | 'r', Finger[]> = {
  l: ['lp', 'lr', 'lm', 'li'],
  r: ['rp', 'rr', 'rm', 'ri'],
}
const HOME_KEYS: Record<'l' | 'r', string[]> = {
  l: ['A', 'S', 'D', 'F'],
  r: [';', 'L', 'K', 'J'],
}

function isActive(f: Finger) {
  return props.active.includes(f)
}

function fill(f: Finger) {
  return isActive(f) ? FINGER_COLORS[f] : '#fde7d4'
}

function labelX(i: number) {
  const cx = SHAPES[i].x + 16
  return props.side === 'l' ? cx : W - cx
}
</script>

<template>
  <svg class="hand" :viewBox="`0 0 ${W} 200`" aria-hidden="true">
    <g :transform="side === 'r' ? `translate(${W},0) scale(-1,1)` : undefined">
      <rect x="14" y="108" width="168" height="84" rx="38" class="palm" />
      <rect
        v-for="(s, i) in SHAPES"
        :key="i"
        :x="s.x"
        :y="s.y"
        width="32"
        :height="s.h"
        rx="16"
        class="finger"
        :class="{ on: isActive(FINGERS[side][i]) }"
        :fill="fill(FINGERS[side][i])"
      />
      <g transform="rotate(52 182 172)">
        <rect
          x="166"
          y="96"
          width="32"
          height="82"
          rx="16"
          class="finger"
          :class="{ on: isActive('th') }"
          :fill="fill('th')"
        />
      </g>
    </g>
    <text
      v-for="(s, i) in SHAPES"
      :key="'t' + i"
      :x="labelX(i)"
      :y="s.y + 22"
      class="tip"
      :class="{ on: isActive(FINGERS[side][i]) }"
    >
      {{ HOME_KEYS[side][i] }}
    </text>
  </svg>
</template>

<style scoped>
.hand {
  height: calc(var(--key) * 2.3);
  width: auto;
  overflow: visible;
}

.palm {
  fill: #fde7d4;
  stroke: #e9b994;
  stroke-width: 3;
}

.finger {
  stroke: #e9b994;
  stroke-width: 3;
  transition: transform 0.15s, fill 0.15s;
  transform-box: fill-box;
  transform-origin: center bottom;
}

.finger.on {
  stroke: #334155;
  transform: translateY(-6px);
}

.tip {
  font-size: 16px;
  font-weight: 700;
  fill: #b08060;
  text-anchor: middle;
}

.tip.on {
  fill: #1e293b;
}
</style>
