<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ArticleCatalog from '@/components/ArticleCatalog.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import TypingText from '@/components/TypingText.vue'
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import { findKeyByChar } from '@/core/keyboard-layout'
import { DEFAULT_RACE_ID, RACE_CATALOG, racePiece, raceSegments } from '@/core/game-catalogs'
import { sound } from '@/core/sound'
import { buildCells, type Cell, type Segment } from '@/core/typing-session'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import { addRecord, records } from '@/stores/records'
import { settings } from '@/stores/settings'

/** 没有本篇历史成绩时，电脑按这个速度匀速跑完。 */
const COMPUTER_WPM = 12

const router = useRouter()
const state = ref<'ready' | 'playing' | 'over'>('ready')
const selectedId = ref(DEFAULT_RACE_ID)
const catalogOpen = ref(false)
const busy = ref(false)
const segments = ref<Segment[]>([])
const cells = ref<Cell[]>([])
const index = ref(0)
const won = ref(false)
const boost = ref(false)
const wrongCode = ref('')
const passageTitle = ref(racePiece(DEFAULT_RACE_ID).title)
const now = ref(Date.now())
const game = reactive({ keystrokes: 0, errors: 0, startAt: 0, endAt: 0 })
const rival = reactive({ wpm: COMPUTER_WPM, label: '电脑' })

let raf = 0
let loopGen = 0
let wrongTimer = 0
let boostTimer = 0
let lastKeyAt = 0
let selectToken = 0

const selected = computed(() => racePiece(selectedId.value))

function bestWpmOf(title: string) {
  let best = 0
  for (const record of records.list) {
    if (record.title === `打字赛车 · ${title}` && record.speedUnit === '词/分' && record.speed > best) best = record.speed
  }
  return best
}

const rivalPreview = computed(() => {
  const best = bestWpmOf(selected.value.title)
  return best > 0 ? { wpm: best, label: '最好成绩' } : { wpm: COMPUTER_WPM, label: '电脑' }
})

const rivalShown = computed(() => (state.value === 'ready' ? rivalPreview.value : { wpm: rival.wpm, label: rival.label }))

const playerProgress = computed(() => (cells.value.length ? index.value / cells.value.length : 0))

const rivalProgress = computed(() => {
  if (!game.startAt || !cells.value.length) return 0
  const end = state.value === 'playing' ? now.value : game.endAt || now.value
  const chars = (rival.wpm * 5 * (end - game.startAt)) / 60000
  return Math.min(1, Math.max(0, chars / cells.value.length))
})

const result = computed(() => {
  const end = game.endAt || now.value
  const ms = game.startAt ? Math.max(0, end - game.startAt) : 0
  const min = ms / 60000
  const correctChars = cells.value.slice(0, index.value).filter((c) => c.state !== 'wrong').length
  const speed = min > 0 ? Math.round(correctChars / 5 / min) : 0
  const accuracy = game.keystrokes ? Math.max(0, Math.round(((game.keystrokes - game.errors) / game.keystrokes) * 100)) : 100
  const score = Math.round(speed * 10 * (accuracy / 100)) + (won.value ? 80 : 0)
  return { ms, speed, accuracy, score, unit: '词/分' }
})

const stand = computed(() => {
  if (playerProgress.value + 0.01 < rivalProgress.value) return '落后'
  if (rivalProgress.value + 0.01 < playerProgress.value) return '领先'
  return '并驾齐驱'
})

const expected = computed(() => cells.value[index.value]?.ch ?? '')

function carLeft(progress: number) {
  return `${Math.min(92, Math.max(0, progress) * 92)}%`
}

function flashWrong(ch: string) {
  wrongCode.value = findKeyByChar(ch)?.key.code ?? ''
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongCode.value = ''), 300)
}

function markBoost() {
  const t = Date.now()
  boost.value = lastKeyAt > 0 && t - lastKeyAt < 320
  lastKeyAt = t
  window.clearTimeout(boostTimer)
  boostTimer = window.setTimeout(() => (boost.value = false), 320)
}

function finish(win: boolean) {
  if (state.value === 'over') return
  won.value = win
  game.endAt = Date.now()
  now.value = game.endAt
  state.value = 'over'
  cancelAnimationFrame(raf)
  if (win) sound.success()
  else sound.fail()
  const r = result.value
  addRecord({
    kind: '打字游戏',
    title: `打字赛车 · ${passageTitle.value}`,
    speed: r.speed,
    speedUnit: r.unit,
    accuracy: r.accuracy,
    durationMs: r.ms,
    score: r.score,
  })
}

function tick(gen: number) {
  if (gen !== loopGen || state.value !== 'playing') return
  if (!catalogOpen.value && !busy.value) {
    now.value = Date.now()
    if (rivalProgress.value >= 1 && index.value < cells.value.length) {
      finish(false)
      return
    }
  }
  raf = requestAnimationFrame(() => tick(gen))
}

function onChar(ch: string) {
  if (catalogOpen.value || busy.value) return
  if (state.value === 'ready') {
    if (ch === ' ') void start()
    return
  }
  if (state.value !== 'playing') return
  const cell = cells.value[index.value]
  if (!cell) return
  game.keystrokes++
  const ok = ch === cell.ch
  if (ok) {
    cell.state = cell.state === 'wrong' ? 'fixed' : 'correct'
    index.value++
    sound.key()
    markBoost()
  } else {
    game.errors++
    cell.state = 'wrong'
    sound.error()
    flashWrong(ch)
    if (settings.articleFreeMode) index.value++
  }
  if (index.value >= cells.value.length) finish(true)
}

function onBackspace() {
  if (catalogOpen.value || busy.value) return
  if (!settings.articleFreeMode || state.value !== 'playing' || index.value === 0) return
  index.value--
  cells.value[index.value].state = 'pending'
}

function begin(nextSegments: Segment[]) {
  const built = buildCells(nextSegments)
  if (!built.length) return false
  segments.value = nextSegments
  cells.value = built
  index.value = 0
  passageTitle.value = selected.value.title
  game.keystrokes = 0
  game.errors = 0
  game.startAt = Date.now()
  game.endAt = 0
  won.value = false
  boost.value = false
  lastKeyAt = 0
  rival.wpm = rivalPreview.value.wpm
  rival.label = rivalPreview.value.label
  now.value = game.startAt
  state.value = 'playing'
  const gen = ++loopGen
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(() => tick(gen))
  return true
}

async function start() {
  if (state.value === 'playing' || catalogOpen.value || busy.value) return
  const piece = selected.value
  const token = ++selectToken
  busy.value = true
  const next = await raceSegments(piece)
  if (token !== selectToken) return
  busy.value = false
  if (!next.length) return
  begin(next)
}

/** 和文章练习换篇一样：换一篇就从头赛这一篇。同一篇只关掉目录，进度和对手都不动。 */
async function selectPiece(id: string) {
  const resume = state.value === 'playing' || state.value === 'over'
  catalogOpen.value = false
  if (id === selectedId.value && state.value !== 'over') return
  selectedId.value = id
  const token = ++selectToken
  if (!resume) {
    busy.value = false
    return
  }
  const piece = selected.value
  busy.value = true
  const next = await raceSegments(piece)
  if (token !== selectToken) return
  busy.value = false
  if (!next.length || piece.id !== selectedId.value) return
  begin(next)
}

function goBack() {
  router.push('/games')
}

const { pressed } = useKeyboardInput({
  onChar,
  onBackspace,
  onEnter: () => {
    if (catalogOpen.value || busy.value) return
    if (state.value === 'over' || state.value === 'ready') void start()
  },
  onEscape: () => {
    if (catalogOpen.value) catalogOpen.value = false
    else goBack()
  },
})

onBeforeUnmount(() => {
  loopGen++
  cancelAnimationFrame(raf)
  window.clearTimeout(wrongTimer)
  window.clearTimeout(boostTimer)
})
</script>

<template>
  <div class="page" :class="{ 'kb-scope no-hands has-kb': settings.showKeyboard }">
    <AppHeader title="🏎️ 打字赛车" :subtitle="state === 'ready' ? selected.title : passageTitle" back="/games">
      <div class="hud">
        <span>你 {{ result.speed }} 词/分</span>
        <span>对手 {{ rivalShown.wpm }} 词/分</span>
        <span v-if="state === 'playing'" :class="stand === '落后' ? 'behind' : 'lead'">{{ stand }}</span>
        <span>{{ result.accuracy }}%</span>
      </div>
      <button class="btn sm primary" type="button" @click="catalogOpen = true">📚 目录</button>
      <button
        class="btn sm"
        :class="{ on: settings.showKeyboard }"
        aria-label="屏幕键盘"
        @click="settings.showKeyboard = !settings.showKeyboard"
      >
        ⌨️
      </button>
    </AppHeader>

    <main class="stage">
      <div class="track">
        <div class="lane">
          <span class="who">你</span>
          <div class="road">
            <span class="car player" :class="{ boost }" :style="{ left: carLeft(playerProgress) }"><span class="glyph">🏎️</span></span>
          </div>
        </div>
        <div class="lane">
          <span class="who">对手</span>
          <div class="road">
            <span class="car" :style="{ left: carLeft(rivalProgress) }"><span class="glyph">🚙</span></span>
          </div>
        </div>
        <span class="flag">🏁</span>
      </div>

      <section class="text-card card">
        <TypingText v-if="cells.length" :segments="segments" :cells="cells" :index="index" size="md" />
        <p v-else class="wait">{{ busy ? '正在准备这篇…' : `当前：${selected.title}。打开目录选一篇，和对手比谁先打完。` }}</p>
        <p v-if="selected.lang === 'en' && selected.translation && state !== 'ready'" class="trans">{{ selected.translation }}</p>
      </section>

      <div v-if="state === 'ready'" class="overlay">
        <div class="card start">
          <h2>🏎️ 打字赛车</h2>
          <p>和电脑或你的历史最好成绩赛跑。英文打原文，中文诗词古文看汉字打拼音。打得越快，车越快。</p>
          <p v-if="selected.lang === 'zh'" class="rule">中文和练习页一样：汉字在上，下面打无声调拼音，ü 用 v，标点不用打。</p>
          <p class="rule">
            {{ settings.articleFreeMode ? '当前是自由纠错：打错会前进，可用退格修改。' : '打错不前进。英文还要打对大小写和标点。' }}
          </p>
          <p class="now">当前：{{ selected.title }}<small v-if="selected.source"> · {{ selected.source }}</small></p>
          <p class="rival-line">对手：{{ rivalShown.label }} · {{ rivalShown.wpm }} 词/分</p>
          <div class="actions">
            <button class="btn" type="button" @click="catalogOpen = true">📚 目录</button>
            <button class="btn primary" type="button" :disabled="busy" @click="start">
              {{ busy ? '加载中…' : '按空格键开始' }}
            </button>
          </div>
        </div>
      </div>
    </main>

    <div v-if="settings.showKeyboard" class="kb-wrap">
      <VirtualKeyboard
        :target="state === 'playing' ? expected : ''"
        :pressed="pressed"
        :wrong-code="wrongCode"
        :finger-colors="settings.fingerColors"
        @press="onChar"
        @backspace="onBackspace"
      />
    </div>

    <ResultDialog
      v-if="state === 'over'"
      :title="won ? '你赢了！' : '对手先到终点'"
      :score="result.score"
      :speed="result.speed"
      :speed-unit="result.unit"
      :accuracy="result.accuracy"
      :duration-ms="result.ms"
      @again="start"
      @back="goBack"
    />

    <ArticleCatalog
      :open="catalogOpen"
      title="🏎️ 打字赛车"
      :items="RACE_CATALOG"
      :current-id="selectedId"
      @close="catalogOpen = false"
      @select="selectPiece"
    />
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  gap: 16px;
  font-size: 16px;
  font-weight: 700;
}

.lead {
  color: #16a34a;
}

.behind {
  color: #ea580c;
}

.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 0 var(--page-pad) var(--page-pad);
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.has-kb .stage {
  margin-bottom: 8px;
}

.track {
  position: relative;
  flex-shrink: 0;
  height: 112px;
  padding: 10px 42px 10px 12px;
  border-radius: 20px;
  background: #334155;
  overflow: hidden;
}

.lane {
  height: 46px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.who {
  width: 42px;
  flex-shrink: 0;
  color: #e2e8f0;
  font-size: 14px;
  font-weight: 700;
}

.road {
  position: relative;
  flex: 1;
  height: 34px;
  border-radius: 999px;
  background: #1e293b;
  box-shadow: inset 0 0 0 2px rgb(255 255 255 / 0.06);
}

.road::before {
  content: '';
  position: absolute;
  left: 12px;
  right: 12px;
  top: 50%;
  border-top: 2px dashed rgb(255 255 255 / 0.28);
}

.car {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 26px;
  line-height: 1;
}

/* 绘文字默认车头朝左。只翻转字形，left 仍从左往右，车头指向终点。 */
.glyph {
  display: inline-block;
  transform: scaleX(-1);
}

.car.player {
  transition: left 0.08s linear;
}

.car.boost {
  filter: drop-shadow(-8px 0 0 #fb923c);
}

.flag {
  position: absolute;
  right: 8px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 26px;
}

.text-card {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 16px 18px;
}

.wait,
.trans,
.rule,
.rival-line {
  color: var(--muted);
}

.wait {
  margin: 0;
  text-align: center;
}

.trans {
  margin: 12px 0 0;
  font-size: 14px;
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  padding: 12px;
  background: rgb(255 255 255 / 0.42);
}

.start {
  width: min(680px, 100%);
  max-height: 100%;
  overflow: auto;
  padding: 24px 28px;
  text-align: center;
}

.start h2 {
  margin: 0 0 8px;
  font-size: 30px;
}

.start p {
  margin: 0 0 8px;
}

.now {
  font-weight: 700;
}

.now small {
  font-weight: 500;
  color: var(--muted);
}

.actions {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 8px;
}

.kb-wrap {
  display: flex;
  justify-content: center;
  padding: 0 var(--page-pad) var(--page-pad);
  flex-shrink: 0;
}
</style>
