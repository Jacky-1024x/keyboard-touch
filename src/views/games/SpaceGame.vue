<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ArticleCatalog from '@/components/ArticleCatalog.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import { findKeyByChar } from '@/core/keyboard-layout'
import { sound } from '@/core/sound'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import {
  SPACE_CATALOG,
  catalogItem,
  chineseWords,
  englishWords,
  loadWordPinyin,
  pinyinLetters,
} from '@/core/game-catalogs'
import { addRecord } from '@/stores/records'
import { settings } from '@/stores/settings'

interface Meteor {
  id: number
  label: string
  sub?: string
  target: string
  /** 横向位置 % */
  x: number
  /** 0=顶部 1=抵达地球 */
  y: number
  /** 短词落得更快 */
  fall: number
  dead: boolean
  hanzi: number
}

const MAX_LIVES = 5
const router = useRouter()
const state = ref<'ready' | 'playing' | 'over'>('ready')
const pieceId = ref(SPACE_CATALOG[0].id)
const catalogOpen = ref(false)
const loading = ref(false)
const piece = computed(() => catalogItem(SPACE_CATALOG, pieceId.value))
const meteors = ref<Meteor[]>([])
const buffer = ref('')
const baseHit = ref(false)
const wrongCode = ref('')
const game = reactive({
  score: 0,
  lives: MAX_LIVES,
  level: 1,
  popped: 0,
  combo: 0,
  keystrokes: 0,
  errors: 0,
  typedChars: 0,
  hanzi: 0,
  startAt: 0,
  endAt: 0,
})

let toPinyin: ((word: string) => string) | null = null
let nextId = 1
let raf = 0
let loopGen = 0
let lastTs = 0
let spawnCd = 0
let wrongTimer = 0
let baseTimer = 0
let alive = true
let selectToken = 0
const pyCache = new Map<string, string>()
const timers = new Set<number>()

const isPinyin = computed(() => piece.value.kind === 'zh')
const speedPerSec = computed(() => 0.09 + (game.level - 1) * 0.02)
const spawnInterval = computed(() => Math.max(700, 2000 - (game.level - 1) * 180))
const maxMeteors = computed(() => Math.min(5, 1 + game.level))

const priority = computed(() => {
  const list = meteors.value.filter((m) => !m.dead)
  if (!list.length) return undefined
  return list.reduce((a, b) => (a.y >= b.y ? a : b))
})

const targetKey = computed(() => priority.value?.target[buffer.value.length] ?? '')

watch(
  () => priority.value?.id,
  () => {
    buffer.value = ''
  },
)

function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id)
    if (alive) fn()
  }, ms)
  timers.add(id)
}

function cachedPinyin(word: string) {
  const hit = pyCache.get(word)
  if (hit) return hit
  const letters = pinyinLetters(toPinyin ? toPinyin(word) : '')
  if (letters) pyCache.set(word, letters)
  return letters
}

function makeItem(): Pick<Meteor, 'label' | 'sub' | 'target' | 'hanzi'> | null {
  if (isPinyin.value) {
    let pool = chineseWords(piece.value)
    if (piece.value.key === 'all' && game.level <= 2) {
      const singles = pool.filter((word) => word.length === 1)
      if (singles.length) pool = singles
    }
    if (!pool.length || !toPinyin) return null
    const used = new Set(meteors.value.filter((m) => !m.dead).map((m) => m.label))
    let word = pool[Math.floor(Math.random() * pool.length)]
    for (let i = 0; i < 6 && used.has(word); i++) word = pool[Math.floor(Math.random() * pool.length)]
    const py = cachedPinyin(word)
    if (!py) return null
    return { label: word, sub: py, target: py, hanzi: Array.from(word.replace(/[^\u3400-\u9fff]/g, '')).length }
  }
  let src = englishWords(piece.value)
  if (piece.value.key === 'all') {
    const short = src.filter((word) => word.en.length <= (game.level <= 2 ? 4 : 8))
    if (short.length) src = short
  }
  if (!src.length) return null
  const used = new Set(meteors.value.filter((m) => !m.dead).map((m) => m.target))
  let word = src[Math.floor(Math.random() * src.length)]
  for (let i = 0; i < 6 && used.has(word.en); i++) word = src[Math.floor(Math.random() * src.length)]
  return { label: word.en, sub: word.zh, target: word.en.toLowerCase(), hanzi: 0 }
}

function pickX() {
  const aliveMeteors = meteors.value.filter((m) => !m.dead)
  for (let i = 0; i < 8; i++) {
    const x = 12 + Math.random() * 76
    if (aliveMeteors.every((m) => Math.abs(m.x - x) > 14)) return x
  }
  return 12 + Math.random() * 76
}

function spawn() {
  if (meteors.value.filter((m) => !m.dead).length >= maxMeteors.value) return
  const item = makeItem()
  if (!item) return
  meteors.value.push({
    id: nextId++,
    ...item,
    x: pickX(),
    y: 0,
    fall: 1.25 - Math.min(item.target.length, 10) * 0.06,
    dead: false,
  })
}

function removeLater(id: number) {
  later(() => {
    meteors.value = meteors.value.filter((m) => m.id !== id)
  }, 280)
}

function meteorTop(y: number) {
  return `calc(${y} * (100% - 72px))`
}

function flashWrong(ch: string) {
  wrongCode.value = findKeyByChar(ch)?.key.code ?? ''
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongCode.value = ''), 300)
}

function hitBase() {
  baseHit.value = true
  window.clearTimeout(baseTimer)
  baseTimer = window.setTimeout(() => (baseHit.value = false), 280)
}

function crash(meteor: Meteor) {
  if (meteor.dead) return
  meteor.dead = true
  meteor.y = 1
  game.lives = Math.max(0, game.lives - 1)
  game.combo = 0
  sound.error()
  hitBase()
  removeLater(meteor.id)
}

function blast(meteor: Meteor) {
  if (meteor.dead) return
  meteor.dead = true
  game.combo++
  game.popped++
  game.typedChars += meteor.target.length
  game.hanzi += meteor.hanzi
  game.score += Math.round(meteor.target.length * 10 * (1 + Math.min(game.combo, 10) * 0.1))
  if (game.popped % 8 === 0) game.level++
  sound.pop()
  buffer.value = ''
  removeLater(meteor.id)
}

function tick(ts: number, gen: number) {
  if (gen !== loopGen || state.value !== 'playing') return
  if (catalogOpen.value) {
    lastTs = 0
    raf = requestAnimationFrame((next) => tick(next, gen))
    return
  }
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0
  lastTs = ts

  for (const meteor of meteors.value) {
    if (meteor.dead) continue
    meteor.y += speedPerSec.value * meteor.fall * dt
    if (meteor.y >= 1) crash(meteor)
  }
  if (game.lives <= 0) return gameOver()

  spawnCd -= dt * 1000
  if (spawnCd <= 0) {
    spawn()
    spawnCd = spawnInterval.value
  }
  raf = requestAnimationFrame((next) => tick(next, gen))
}

function onChar(ch: string) {
  if (catalogOpen.value) return
  if (state.value === 'ready') {
    if (ch === ' ') void start()
    return
  }
  if (state.value !== 'playing' || ch === ' ') return
  const meteor = priority.value
  if (!meteor) return
  ch = ch.toLowerCase()
  game.keystrokes++
  if (meteor.target[buffer.value.length] !== ch) {
    game.errors++
    game.combo = 0
    sound.error()
    flashWrong(ch)
    return
  }
  buffer.value += ch
  sound.key()
  if (buffer.value === meteor.target) blast(meteor)
}

function onBackspace() {
  if (catalogOpen.value || state.value !== 'playing' || !buffer.value) return
  buffer.value = buffer.value.slice(0, -1)
}

const result = computed(() => {
  const ms = (game.endAt || Date.now()) - game.startAt
  const min = ms / 60000
  const accuracy = game.keystrokes ? Math.round(((game.keystrokes - game.errors) / game.keystrokes) * 100) : 100
  const speed = min > 0 ? Math.round(isPinyin.value ? game.hanzi / min : game.typedChars / 5 / min) : 0
  return { ms, accuracy, speed, unit: isPinyin.value ? '字/分' : '词/分' }
})

function gameOver() {
  if (state.value === 'over') return
  state.value = 'over'
  game.endAt = Date.now()
  cancelAnimationFrame(raf)
  sound.fail()
  addRecord({
    kind: '打字游戏',
    title: `太空保卫战 · ${piece.value.title}`,
    speed: result.value.speed,
    speedUnit: result.value.unit,
    accuracy: result.value.accuracy,
    durationMs: result.value.ms,
    score: game.score,
  })
}

async function ensurePinyin() {
  if (!isPinyin.value) return true
  if (toPinyin) return true
  loading.value = true
  toPinyin = await loadWordPinyin()
  loading.value = false
  return alive
}

function beginRound() {
  meteors.value = []
  buffer.value = ''
  Object.assign(game, {
    score: 0,
    lives: MAX_LIVES,
    level: 1,
    popped: 0,
    combo: 0,
    keystrokes: 0,
    errors: 0,
    typedChars: 0,
    hanzi: 0,
    startAt: Date.now(),
    endAt: 0,
  })
  lastTs = 0
  spawnCd = spawnInterval.value
  state.value = 'playing'
  const gen = ++loopGen
  cancelAnimationFrame(raf)
  spawn()
  raf = requestAnimationFrame((next) => tick(next, gen))
}

async function start() {
  if (state.value === 'playing' || catalogOpen.value) return
  if (!(await ensurePinyin())) return
  beginRound()
}

/** 和文章练习换篇一样：换目录就重开这一局，心数和分数重计。同一篇只关掉目录。 */
async function selectPiece(id: string) {
  const resume = state.value === 'playing' || state.value === 'over'
  catalogOpen.value = false
  if (id === pieceId.value) return
  pieceId.value = id
  const token = ++selectToken
  if (!(await ensurePinyin())) return
  if (!alive || token !== selectToken) return
  if (resume) beginRound()
}

function goBack() {
  router.push('/games')
}

const { pressed } = useKeyboardInput({
  onChar,
  onBackspace,
  onEnter: () => {
    if (catalogOpen.value) return
    if (state.value === 'over' || state.value === 'ready') void start()
  },
  onEscape: () => {
    if (catalogOpen.value) catalogOpen.value = false
    else goBack()
  },
})

onBeforeUnmount(() => {
  alive = false
  loopGen++
  cancelAnimationFrame(raf)
  timers.forEach((id) => window.clearTimeout(id))
  window.clearTimeout(wrongTimer)
  window.clearTimeout(baseTimer)
})
</script>

<template>
  <div class="page" :class="{ 'kb-scope no-hands has-kb': settings.showKeyboard }">
    <AppHeader title="🚀 太空保卫战" :subtitle="piece.source || piece.title" back="/games">
      <div class="hud">
        <span>⭐ {{ game.score }}</span>
        <span>🏅 第 {{ game.level }} 关</span>
        <span v-if="priority" class="aim">
          <em v-if="isPinyin">{{ priority.label }}</em>
          <b>{{ buffer }}</b>{{ priority.target.slice(buffer.length) }}
        </span>
        <span v-if="game.combo > 1" class="combo">🔥 连击 ×{{ game.combo }}</span>
        <span class="lives">
          <i v-for="i in MAX_LIVES" :key="i" :class="{ lost: i > game.lives }">❤️</i>
        </span>
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
      <div class="sky">
        <div
          v-for="m in meteors"
          :key="m.id"
          class="meteor"
          :class="{ dead: m.dead, lock: m.id === priority?.id }"
          :style="{ left: `${m.x}%`, top: meteorTop(m.y) }"
        >
          <span class="rock">☄️</span>
          <span class="label">
            <template v-if="m.id === priority?.id && !isPinyin">
              <b v-if="buffer" class="typed">{{ m.label.slice(0, buffer.length) }}</b>{{ m.label.slice(buffer.length) }}
            </template>
            <template v-else>{{ m.label }}</template>
          </span>
          <span v-if="m.sub" class="sub">
            <template v-if="m.id === priority?.id && isPinyin">
              <b v-if="buffer" class="typed">{{ m.sub.slice(0, buffer.length) }}</b>{{ m.sub.slice(buffer.length) }}
            </template>
            <template v-else>{{ m.sub }}</template>
          </span>
        </div>
        <div class="ship" :style="{ left: `${priority?.x ?? 50}%` }"><span class="craft">🚀</span></div>
        <div class="ground" :class="{ hit: baseHit }">🌍 地球</div>

        <div v-if="state === 'ready'" class="overlay">
          <div class="card start">
            <h2>🚀 太空保卫战</h2>
            <p v-if="isPinyin">陨石上同时写着汉字和拼音。打出完整拼音击落（不用声调，ü 用 v），必须先打最靠近地球的一颗。</p>
            <p v-else>陨石上写着英文单词和中文意思。打出完整单词就能击落，必须先打最靠近地球的一颗。短词掉得更快。</p>
            <p class="now">当前：{{ piece.title }}</p>
            <div class="actions">
              <button class="btn" type="button" @click="catalogOpen = true">📚 目录</button>
              <button class="btn primary" type="button" :disabled="loading" @click="start">
                {{ loading ? '加载中…' : '按空格键开始' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <div v-if="settings.showKeyboard" class="kb-wrap">
      <VirtualKeyboard
        :target="targetKey"
        :pressed="pressed"
        :wrong-code="wrongCode"
        :finger-colors="settings.fingerColors"
        @press="onChar"
        @backspace="onBackspace"
      />
    </div>

    <ResultDialog
      v-if="state === 'over'"
      title="游戏结束"
      :score="game.score"
      :speed="result.speed"
      :speed-unit="result.unit"
      :accuracy="result.accuracy"
      :duration-ms="result.ms"
      @again="start"
      @back="goBack"
    />

    <ArticleCatalog
      :open="catalogOpen"
      title="🚀 太空保卫战"
      :items="SPACE_CATALOG"
      :current-id="pieceId"
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
  font-size: 18px;
  font-weight: 700;
}

.aim {
  font-family: Menlo, monospace;
  font-size: 20px;
  letter-spacing: 0.5px;
}

.aim em {
  margin-right: 8px;
  font-family: -apple-system, 'PingFang SC', sans-serif;
  font-style: normal;
  font-weight: 800;
}

.aim b {
  color: #16a34a;
}

.combo {
  color: #ea580c;
}

.lives i {
  font-style: normal;
}

.lives .lost {
  filter: grayscale(1);
  opacity: 0.3;
}

.stage {
  position: relative;
  flex: 1;
  min-height: 0;
  margin: 0 var(--page-pad) var(--page-pad);
  display: flex;
}

.has-kb .stage {
  margin-bottom: 8px;
}

.sky {
  position: relative;
  flex: 1;
  min-height: 0;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 12% 20%, #fff 0 1.5px, transparent 2px),
    radial-gradient(circle at 28% 72%, #fff 0 1px, transparent 1.6px),
    radial-gradient(circle at 70% 28%, #fff 0 1.5px, transparent 2px),
    radial-gradient(circle at 84% 64%, #fff 0 1px, transparent 1.6px),
    radial-gradient(circle at 48% 14%, #fff 0 1px, transparent 1.6px),
    linear-gradient(180deg, #0f172a 0%, #1e1b4b 55%, #312e81 100%);
}

.meteor {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 72px;
  padding: 8px 12px 10px;
  border-radius: 18px;
  background: linear-gradient(180deg, #e2e8f0, #94a3b8 40%, #78716c);
  box-shadow: 0 8px 16px rgb(0 0 0 / 0.28);
  color: #1e293b;
  transition: opacity 0.25s, transform 0.25s;
}

.meteor.lock {
  outline: 3px solid #facc15;
  background: linear-gradient(180deg, #fef3c7, #fdba74 45%, #b45309);
}

.rock {
  font-size: 18px;
  line-height: 1;
}

.label {
  font-size: 22px;
  font-weight: 800;
  white-space: nowrap;
}

.sub {
  font-size: 13px;
  color: rgb(30 41 59 / 0.75);
  white-space: nowrap;
}

.typed {
  color: #16a34a;
  background: #dcfce7;
  border-radius: 4px;
}

.meteor.dead {
  opacity: 0;
  transform: translateX(-50%) scale(1.45);
}

.ship {
  position: absolute;
  bottom: 46px;
  z-index: 2;
  transition: left 0.25s ease;
}

.craft {
  display: block;
  transform: translateX(-50%) rotate(-45deg);
  font-size: 30px;
  filter: drop-shadow(0 4px 4px rgb(0 0 0 / 0.35));
}

.ground {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 52px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, transparent, #14532d 42%, #166534);
  color: #ecfccb;
  font-weight: 800;
}

.ground.hit {
  background: linear-gradient(180deg, transparent, #7f1d1d 42%, #b91c1c);
}

.overlay {
  position: absolute;
  inset: 0;
  z-index: 3;
  display: grid;
  place-items: center;
  background: rgb(15 23 42 / 0.35);
}

.start {
  padding: 28px 36px;
  text-align: center;
  max-width: min(520px, 92%);
}

.start h2 {
  margin: 0 0 12px;
  font-size: 30px;
}

.start p {
  margin: 0 0 12px;
  color: var(--muted);
}

.now {
  color: var(--text);
  font-weight: 700;
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
