<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import type { Cell, Segment } from '@/core/typing-session'

const props = withDefaults(
  defineProps<{
    segments: Segment[]
    cells: Cell[]
    index: number
    size?: 'lg' | 'md'
  }>(),
  { size: 'md' },
)

const box = ref<HTMLElement>()

/** 每个 segment 对应的 cell 下标（含其后的分隔符） */
const segCells = computed(() => {
  const map: number[][] = props.segments.map(() => [])
  props.cells.forEach((c, i) => map[c.seg]?.push(i))
  return map
})

const currentSeg = computed(() => props.cells[props.index]?.seg ?? -1)

watch(
  () => props.index,
  async () => {
    await nextTick()
    const el = box.value?.querySelector('.cursor') as HTMLElement | null
    el?.scrollIntoView({ block: 'center', behavior: 'smooth' })
  },
)
</script>

<template>
  <div ref="box" class="typing-text" :class="size">
    <template v-for="(seg, i) in segments" :key="i">
      <span v-if="seg.skip && seg.label === '\n'" class="br" />
      <span v-else class="seg" :class="{ skip: seg.skip, current: i === currentSeg, labeled: !!seg.label }">
        <span v-if="seg.label" class="seg-label">{{ seg.label }}</span>
        <span class="seg-chars">
          <span
            v-for="ci in segCells[i]"
            :key="ci"
            class="ch"
            :class="[cells[ci].state, { cursor: ci === index, sep: cells[ci].sep }]"
            >{{ cells[ci].ch === ' ' ? '\u00a0' : cells[ci].ch }}</span
          >
        </span>
      </span>
    </template>
  </div>
</template>

<style scoped>
.typing-text {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  align-content: flex-start;
  row-gap: 0.5em;
  font-family: 'SF Mono', Menlo, Consolas, 'Courier New', monospace;
  line-height: 1.3;
  color: #94a3b8;
}

.typing-text.lg {
  font-size: clamp(28px, 4.2vw, 48px);
  justify-content: center;
  row-gap: 0.4em;
}

.typing-text.md {
  font-size: clamp(22px, 2.6vw, 30px);
}

.br {
  flex-basis: 100%;
  height: 0;
}

.seg {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.seg-label {
  font-family: -apple-system, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
  font-size: 0.75em;
  color: #475569;
  min-height: 1.2em;
}

.seg.labeled .seg-label {
  padding: 0 0.15em;
}

.seg.current .seg-label {
  color: #2563eb;
  font-weight: 700;
}

.seg.skip .seg-label {
  color: #94a3b8;
}

.seg-chars {
  display: inline-flex;
  min-height: 1.3em;
}

.ch {
  position: relative;
  border-radius: 4px;
  transition: color 0.1s;
  white-space: pre;
}

.ch.sep {
  width: 0.6em;
}

.ch.correct {
  color: #16a34a;
}

.ch.fixed {
  color: #d97706;
}

.ch.wrong {
  color: #fff;
  background: #ef4444;
}

.ch.sep.wrong {
  background: #fecaca;
}

.ch.cursor {
  color: #1e293b;
  background: #dbeafe;
}

.ch.cursor::after {
  content: '';
  position: absolute;
  left: 8%;
  right: 8%;
  bottom: -4px;
  height: 4px;
  border-radius: 2px;
  background: #2563eb;
  animation: blink 1s steps(1) infinite;
}

.ch.cursor.wrong {
  background: #ef4444;
  color: #fff;
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
