<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import StatsBar from '@/components/StatsBar.vue'
import TypingText from '@/components/TypingText.vue'
import KeyboardDock from '@/components/KeyboardDock.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import { useTypingSession, type SessionResult } from '@/core/typing-session'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import { findKeyByChar } from '@/core/keyboard-layout'
import { KIND_NAMES, type PracticeSource } from '@/core/practice-sources'
import { sound } from '@/core/sound'
import { settings } from '@/stores/settings'
import { addRecord } from '@/stores/records'

const props = defineProps<{ source: PracticeSource; back: string }>()
const router = useRouter()

const session = useTypingSession({
  mode: props.source.beginner || !settings.articleFreeMode ? 'block' : 'free',
  hanziSpeed: props.source.kind === 'zh-pinyin',
})
session.load(props.source.segments)

const result = ref<SessionResult | null>(null)
const wrongCode = ref('')
const showTranslation = ref(false)
let wrongTimer: number | undefined

const handsOverride = ref<boolean | null>(null)
const showHands = computed(() => {
  if (!settings.showKeyboard) return false
  if (handsOverride.value !== null) return handsOverride.value
  if (settings.fingerMode === 'auto') return props.source.beginner
  return settings.fingerMode === 'on'
})

function flashWrong(code: string) {
  wrongCode.value = code
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongCode.value = ''), 300)
}

function handleChar(ch: string, code?: string) {
  if (result.value) return
  const fb = session.input(ch)
  if (fb === 'ignored') return
  if (fb === 'correct') {
    sound.key()
  } else {
    sound.error()
    flashWrong(code ?? findKeyByChar(ch)?.key.code ?? '')
  }
  if (session.finished.value) onFinish()
}

function onFinish() {
  const r = session.result()
  result.value = r
  sound.success()
  addRecord({
    kind: KIND_NAMES[props.source.kind],
    title: props.source.title,
    speed: r.speed,
    speedUnit: r.speedUnit,
    accuracy: r.accuracy,
    durationMs: r.durationMs,
  })
}

function again() {
  result.value = null
  if (props.source.regenerate) session.load(props.source.regenerate())
  else session.restart()
}

function goBack() {
  router.push(props.back)
}

const { pressed } = useKeyboardInput({
  onChar: (ch, e) => handleChar(ch, e.code),
  onBackspace: () => session.backspace(),
  onEnter: () => result.value && again(),
  onEscape: goBack,
})
</script>

<template>
  <div class="page kb-scope" :class="{ 'no-hands': !showHands }">
    <AppHeader :title="source.title" :subtitle="source.subtitle" :back="back">
      <button
        v-if="settings.showKeyboard"
        class="btn sm"
        :class="{ on: showHands }"
        @click="handsOverride = !showHands"
      >
        🖐 手指
      </button>
      <button class="btn sm" :class="{ on: settings.showKeyboard }" @click="settings.showKeyboard = !settings.showKeyboard">
        ⌨️ 键盘
      </button>
      <button v-if="source.translation" class="btn sm" :class="{ on: showTranslation }" @click="showTranslation = !showTranslation">
        译文
      </button>
      <button class="btn sm" @click="again">🔄 重来</button>
    </AppHeader>

    <main class="practice">
      <StatsBar
        class="stats"
        :speed="session.speed.value"
        :speed-unit="session.speedUnit.value"
        :accuracy="session.accuracy.value"
        :elapsed-ms="session.elapsedMs.value"
        :progress="session.progress.value"
      />

      <section class="text-area card">
        <div class="inner">
          <p v-if="!session.started.value" class="hint">
            {{ source.beginner ? '手指放在基准键上（摸到 F 和 J 的小凸点），开始打字吧！' : '准备好了就开始打字吧！' }}
          </p>
          <TypingText
            :segments="session.segments.value"
            :cells="session.cells.value"
            :index="session.index.value"
            :size="source.kind === 'basic' ? 'lg' : 'md'"
          />
          <p v-if="showTranslation && source.translation" class="translation">{{ source.translation }}</p>
        </div>
      </section>

      <KeyboardDock
        v-if="settings.showKeyboard"
        :target="session.expected.value"
        :pressed="pressed"
        :wrong-code="wrongCode"
        :show-hands="showHands"
        @press="handleChar"
        @backspace="session.backspace()"
      />
    </main>

    <ResultDialog
      v-if="result"
      :speed="result.speed"
      :speed-unit="result.speedUnit"
      :accuracy="result.accuracy"
      :duration-ms="result.durationMs"
      @again="again"
      @back="goBack"
    />
  </div>
</template>

<style scoped>
.practice {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  padding: 0 var(--page-pad) 16px;
  padding-bottom: max(16px, env(safe-area-inset-bottom));
}

.stats {
  width: 100%;
  height: var(--stats-h);
  flex-shrink: 0;
}

.text-area {
  position: relative;
  width: 100%;
  flex: 1;
  min-height: var(--text-min-h);
  overflow-y: auto;
  padding: 24px 32px;
  display: flex;
  flex-direction: column;
}

/* 用 auto margin 垂直居中，内容溢出时不会被裁掉顶部 */
.inner {
  margin: auto 0;
}

.hint {
  margin: 0 0 16px;
  text-align: center;
  color: var(--muted);
  font-size: 15px;
}

.translation {
  margin: 20px 0 0;
  padding-top: 12px;
  border-top: 1px dashed #e2e8f0;
  color: #64748b;
  font-size: 16px;
  line-height: 1.7;
}
</style>
