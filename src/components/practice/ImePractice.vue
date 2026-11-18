<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ArticleCatalog from '@/components/ArticleCatalog.vue'
import StatsBar from '@/components/StatsBar.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import type { PracticeSource } from '@/core/practice-sources'
import { sound } from '@/core/sound'
import { addRecord } from '@/stores/records'

/**
 * 中文输入（输入法）练习：对照原文，用系统输入法直接打汉字。
 * 比较时忽略空白和换行，方便古诗等分行内容。
 */
const props = defineProps<{ source: PracticeSource; back: string }>()
const router = useRouter()

const textarea = ref<HTMLTextAreaElement>()
const value = ref('')
/** 输入法合成结束后的已上屏文本 */
const committed = ref('')
const composing = ref(false)
const catalogOpen = ref(false)
const startAt = ref(0)
const endAt = ref(0)
const now = ref(Date.now())
let timer: number | undefined

function selectArticle(id: string) {
  catalogOpen.value = false
  if (id === props.source.articleId) return
  router.push(`/practice/${props.source.kind}/${id}`)
}

const strip = (s: string) => s.replace(/\s+/g, '')

/** 原文逐字符，带“第几个有效字符”的下标（空白为 -1） */
const targetChars = computed(() => {
  let n = 0
  return Array.from(props.source.rawText).map((ch) => ({ ch, idx: /\s/.test(ch) ? -1 : n++ }))
})
const target = computed(() => Array.from(strip(props.source.rawText)))
const typed = computed(() => Array.from(strip(committed.value)))

const correctCount = computed(() => typed.value.filter((ch, i) => ch === target.value[i]).length)
const accuracy = computed(() => (typed.value.length ? Math.round((correctCount.value / typed.value.length) * 100) : 100))
const elapsedMs = computed(() => (startAt.value ? (endAt.value || now.value) - startAt.value : 0))
const speed = computed(() => {
  const min = elapsedMs.value / 60000
  return min > 0 ? Math.round(correctCount.value / min) : 0
})
const progress = computed(() => Math.min(1, typed.value.length / target.value.length))
const finished = computed(() => endAt.value > 0)

function stateOf(idx: number) {
  if (idx < 0) return ''
  if (idx === typed.value.length) return 'cursor'
  if (idx > typed.value.length) return ''
  return typed.value[idx] === target.value[idx] ? 'correct' : 'wrong'
}

function evaluate() {
  if (composing.value || finished.value) return
  const prevLen = typed.value.length
  committed.value = value.value
  if (!startAt.value && committed.value) {
    startAt.value = Date.now()
    timer = window.setInterval(() => (now.value = Date.now()), 250)
  }
  const last = typed.value.length - 1
  if (typed.value.length > prevLen && last >= 0) {
    if (typed.value[last] === target.value[last]) sound.key()
    else sound.error()
  }
  if (typed.value.length >= target.value.length) finish()
}

function finish() {
  endAt.value = Date.now()
  window.clearInterval(timer)
  sound.success()
  addRecord({
    kind: '中文输入',
    title: props.source.title,
    speed: speed.value,
    speedUnit: '字/分',
    accuracy: accuracy.value,
    durationMs: elapsedMs.value,
  })
}

function again() {
  window.clearInterval(timer)
  value.value = ''
  committed.value = ''
  startAt.value = 0
  endAt.value = 0
  nextTick(() => textarea.value?.focus())
}

function onCompositionEnd() {
  composing.value = false
  // compositionend 之后 input 事件在不同浏览器顺序不一致，延后一帧再取值
  requestAnimationFrame(evaluate)
}

function onKeyDown(e: KeyboardEvent) {
  if (finished.value && e.key === 'Enter') {
    e.preventDefault()
    again()
  }
}

onMounted(() => textarea.value?.focus())
onBeforeUnmount(() => window.clearInterval(timer))
</script>

<template>
  <div class="page">
    <AppHeader :title="source.title" :subtitle="source.subtitle ?? '中文输入'" :back="back">
      <button v-if="source.catalog?.length" class="btn sm primary" @click="catalogOpen = true">📚 目录</button>
      <button class="btn sm" @click="again">🔄 重来</button>
    </AppHeader>

    <main class="practice">
      <StatsBar
        class="stats"
        :speed="speed"
        speed-unit="字/分"
        :accuracy="accuracy"
        :elapsed-ms="elapsedMs"
        :progress="progress"
      />

      <section class="target card">
        <span v-for="(c, i) in targetChars" :key="i" :class="['ch', stateOf(c.idx), { br: c.ch === '\n' }]">{{
          c.ch === '\n' ? '' : c.ch
        }}</span>
      </section>

      <textarea
        ref="textarea"
        v-model="value"
        class="input card"
        placeholder="切换到中文输入法，照着上面的文字输入…"
        :disabled="finished"
        autocomplete="off"
        autocapitalize="off"
        spellcheck="false"
        @compositionstart="composing = true"
        @compositionend="onCompositionEnd"
        @input="evaluate"
        @keydown="onKeyDown"
      />
    </main>

    <ResultDialog
      v-if="finished"
      :speed="speed"
      speed-unit="字/分"
      :accuracy="accuracy"
      :duration-ms="elapsedMs"
      @again="again"
      @back="router.push(back)"
    />

    <ArticleCatalog
      v-if="source.catalog"
      :open="catalogOpen"
      :title="source.catalogTitle ?? '目录'"
      :items="source.catalog"
      :current-id="source.articleId ?? ''"
      @close="catalogOpen = false"
      @select="selectArticle"
    />
  </div>
</template>

<style scoped>
.practice {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 var(--page-pad) 16px;
}

.stats {
  height: var(--stats-h);
  flex-shrink: 0;
}

.target {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 24px 32px;
  font-size: clamp(24px, 3vw, 34px);
  line-height: 1.8;
  letter-spacing: 0.1em;
  color: #475569;
}

.ch.br {
  display: block;
}

.ch.correct {
  color: #16a34a;
}

.ch.wrong {
  color: #fff;
  background: #ef4444;
  border-radius: 4px;
}

.ch.cursor {
  background: #dbeafe;
  border-bottom: 3px solid #2563eb;
}

.input {
  flex: 0 0 30%;
  border: 2px solid transparent;
  padding: 16px 20px;
  font-size: 24px;
  line-height: 1.6;
  resize: none;
  outline: none;
  font-family: inherit;
}

.input:focus {
  border-color: #93c5fd;
}
</style>
