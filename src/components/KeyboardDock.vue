<script setup lang="ts">
import { computed } from 'vue'
import VirtualKeyboard from './VirtualKeyboard.vue'
import HandsGuide from './HandsGuide.vue'
import { fingersForChar } from '@/core/keyboard-layout'
import { settings } from '@/stores/settings'

const props = defineProps<{
  target: string
  pressed?: Set<string>
  wrongCode?: string
  showHands: boolean
}>()

defineEmits<{ (e: 'press', ch: string): void; (e: 'backspace'): void }>()

const activeFingers = computed(() => fingersForChar(props.target))
</script>

<template>
  <div class="dock" :class="{ 'with-hands': showHands }">
    <VirtualKeyboard
      :target="target"
      :pressed="pressed"
      :wrong-code="wrongCode"
      :finger-colors="settings.fingerColors"
      @press="$emit('press', $event)"
      @backspace="$emit('backspace')"
    />
    <HandsGuide v-if="showHands" class="hands" :active="activeFingers" />
  </div>
</template>

<style scoped>
.dock {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.hands {
  margin-top: calc(var(--key) * -0.3);
  pointer-events: none;
  opacity: 0.95;
}
</style>
