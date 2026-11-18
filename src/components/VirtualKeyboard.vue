<script setup lang="ts">
import { computed } from 'vue'
import { FINGER_COLORS, KEYBOARD_ROWS, findKeyByChar, shiftCodeFor, type KeyDef } from '@/core/keyboard-layout'

const props = withDefaults(
  defineProps<{
    /** 下一个要输入的字符，对应按键高亮 */
    target?: string
    /** 当前按下的物理键 code */
    pressed?: Set<string>
    /** 刚刚按错的键 code */
    wrongCode?: string
    /** 按指法分区着色 */
    fingerColors?: boolean
  }>(),
  { target: '', fingerColors: true },
)

const emit = defineEmits<{
  /** 触屏点击屏幕键盘（无外接键盘时的兜底输入） */
  (e: 'press', ch: string): void
  (e: 'backspace'): void
}>()

const targetCodes = computed(() => {
  const hit = props.target ? findKeyByChar(props.target) : undefined
  if (!hit) return new Set<string>()
  const set = new Set([hit.key.code])
  if (hit.shift) set.add(shiftCodeFor(hit.key.finger))
  return set
})

function keyLabel(key: KeyDef) {
  if (key.fn) return key.label
  return /[a-z]/.test(key.label) ? key.label.toUpperCase() : key.label
}

function keyStyle(key: KeyDef) {
  return {
    '--w': key.width ?? 1,
    '--finger': props.fingerColors ? FINGER_COLORS[key.finger] : '#e2e8f0',
  }
}

function onPointerDown(key: KeyDef) {
  if (key.code === 'Backspace') return emit('backspace')
  if (key.fn) return
  if (key.code === 'Space') return emit('press', ' ')
  // 触屏模式下：若目标需要 Shift 且点的正是目标键，则输出目标字符
  const hit = props.target ? findKeyByChar(props.target) : undefined
  if (hit && hit.key.code === key.code) return emit('press', props.target)
  emit('press', key.label)
}
</script>

<template>
  <div class="kb" :class="{ plain: !fingerColors }">
    <div v-for="(row, r) in KEYBOARD_ROWS" :key="r" class="kb-row">
      <button
        v-for="key in row"
        :key="key.code"
        type="button"
        class="key"
        :class="{
          fn: key.fn,
          space: key.code === 'Space',
          target: targetCodes.has(key.code),
          pressed: pressed?.has(key.code),
          wrong: wrongCode === key.code,
          home: key.home,
        }"
        :style="keyStyle(key)"
        @pointerdown.prevent="onPointerDown(key)"
      >
        <span v-if="key.shiftLabel && !/[a-z]/.test(key.label)" class="shift-label">{{ key.shiftLabel }}</span>
        <span class="label">{{ keyLabel(key) }}</span>
        <span v-if="key.bump" class="bump" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.kb {
  --gap: calc(var(--key) * 0.08);
  display: flex;
  flex-direction: column;
  gap: var(--gap);
  padding: calc(var(--key) * 0.15);
  background: #334155;
  border-radius: calc(var(--key) * 0.2);
  box-shadow: 0 8px 24px rgb(15 23 42 / 0.25);
  user-select: none;
  -webkit-user-select: none;
  touch-action: manipulation;
}

.kb-row {
  display: flex;
  justify-content: center;
  gap: var(--gap);
}

.key {
  position: relative;
  width: calc(var(--key) * var(--w) + var(--gap) * (var(--w) - 1));
  height: var(--key);
  border: none;
  border-radius: calc(var(--key) * 0.14);
  background: var(--finger);
  color: #1e293b;
  font-size: calc(var(--key) * 0.36);
  font-weight: 700;
  box-shadow: 0 calc(var(--key) * 0.06) 0 rgb(0 0 0 / 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: transform 0.06s, box-shadow 0.06s, filter 0.15s;
  cursor: pointer;
}

.key.fn {
  font-size: calc(var(--key) * 0.24);
  filter: saturate(0.4) brightness(0.92);
}

.shift-label {
  font-size: calc(var(--key) * 0.22);
  opacity: 0.6;
  margin-bottom: 2px;
}

.bump {
  position: absolute;
  bottom: calc(var(--key) * 0.14);
  width: calc(var(--key) * 0.24);
  height: 3px;
  border-radius: 2px;
  background: rgb(30 41 59 / 0.6);
}

.key.target {
  outline: calc(var(--key) * 0.06) solid #fff;
  outline-offset: -2px;
  animation: breathe 1s ease-in-out infinite;
  filter: none;
  z-index: 1;
}

.key.pressed {
  transform: translateY(calc(var(--key) * 0.05));
  box-shadow: 0 1px 0 rgb(0 0 0 / 0.25);
  filter: brightness(0.85);
}

.key.wrong {
  background: #ef4444 !important;
  color: #fff;
  animation: shake 0.25s;
}

@keyframes breathe {
  0%,
  100% {
    box-shadow: 0 0 0 0 rgb(255 255 255 / 0.9), 0 calc(var(--key) * 0.06) 0 rgb(0 0 0 / 0.25);
  }
  50% {
    box-shadow: 0 0 0 calc(var(--key) * 0.12) rgb(255 255 255 / 0), 0 calc(var(--key) * 0.06) 0 rgb(0 0 0 / 0.25);
  }
}

@keyframes shake {
  25% {
    transform: translateX(-3px);
  }
  75% {
    transform: translateX(3px);
  }
}
</style>
