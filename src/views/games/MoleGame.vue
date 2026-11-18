<script setup lang="ts">
import { computed, onBeforeUnmount, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ArticleCatalog from '@/components/ArticleCatalog.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import VirtualKeyboard from '@/components/VirtualKeyboard.vue'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import { findKeyByChar } from '@/core/keyboard-layout'
import { sound } from '@/core/sound'
import {
  MOLE_CATALOG,
  catalogItem,
  chineseWords,
  englishWords,
  loadWordPinyin,
  pinyinLetters,
  type GameCatalogItem,
} from '@/core/game-catalogs'
import { addRecord } from '@/stores/records'
import { settings } from '@/stores/settings'

/** 基准键。路线图：地鼠举着字母冒出，适合基准键入门。 */
const HOME = ['a', 's', 'd', 'f', 'j', 'k', 'l', ';']
const HOLES = 9
const MAX_LIVES = 5

interface Mole {
  id: number
  hole: number
  letter: string
  /** 剩余停留秒数 */
  left: number
  phase: 'rise' | 'up' | 'hit' | 'miss'
  kind: GameCatalogItem['kind']
  /** 英文单词，或汉字 */
  word: string
  /** 英文的中文意思；拼音写在 spell */
  gloss: string
  spell: string
  /** 已经打对的前缀长度。基准键不用。 */
  progress: number
}

const router = useRouter()
const state = ref<'ready' | 'playing' | 'over'>('ready')
const pieceId = ref(MOLE_CATALOG[0].id)
const catalogOpen = ref(false)
const loading = ref(false)
const moles = ref<Mole[]>([])
const piece = computed(() => catalogItem(MOLE_CATALOG, pieceId.value))
const game = reactive({
  score: 0,
  lives: MAX_LIVES,
  level: 1,
  hits: 0,
  combo: 0,
  keystrokes: 0,
  errors: 0,
  typedChars: 0,
  startAt: 0,
  endAt: 0,
})
const wrongCode = ref('')

let nextId = 1
let raf = 0
let loopGen = 0
let lastTs = 0
let spawnCd = 0
let wrongTimer = 0
let alive = true
let selectToken = 0
let toPinyin: ((word: string) => string) | null = null
const pyCache = new Map<string, string>()
const timers = new Set<number>()

/**
 * 基准键沿用原来的单字母节奏。
 * 单词和拼音按词长加长停留与出怪间隔；升级仍会变快，但长词留得够打完。
 * 还没开打时场上最多 1 只，下一只仍按词长间隔等。
 * 打对当前词的首字母后立刻预告下一只，最多 2 只。
 */
function homeStay() {
  return Math.max(0.85, 2.7 - (game.level - 1) * 0.22)
}

function homeGap() {
  return Math.max(520, 1500 - (game.level - 1) * 140)
}

function stayFor(kind: Mole['kind'], len: number) {
  if (kind === 'home') return homeStay()
  const n = Math.max(1, len)
  const look = Math.max(0.8, 1.25 - (game.level - 1) * 0.045)
  const per = Math.max(0.58, 0.88 - (game.level - 1) * 0.03)
  return homeStay() + look + per * (n - 1)
}

function gapFor(len: number) {
  const n = Math.max(1, len)
  const base = Math.max(1200, 2000 - (game.level - 1) * 80)
  const per = Math.max(280, 450 - (game.level - 1) * 16)
  return base + per * n
}

const holes = computed(() => {
  const slots: (Mole | null)[] = Array.from({ length: HOLES }, () => null)
  for (const mole of moles.value) slots[mole.hole] = mole
  return slots
})

function activeMoles() {
  return moles.value.filter((m) => m.phase === 'rise' || m.phase === 'up')
}

/** 基准键没有打到一半的前缀，始终一只。单词打对首字母后才允许第二只。 */
function moleCap() {
  if (piece.value.kind === 'home') return 1
  return activeMoles().some((m) => m.progress > 0) ? 2 : 1
}

function targetOf(mole: Mole) {
  if (mole.kind === 'zh') return mole.spell
  if (mole.kind === 'en') return mole.word
  return mole.letter
}

/** 正在打的那只是当前目标。还没开打时，最早冒出来的那只是目标，不按谁更快缩回。 */
const currentMole = computed(() => {
  const active = activeMoles()
  const typing = active.filter((m) => m.progress > 0)
  const pool = typing.length ? typing : active
  if (!pool.length) return undefined
  return pool.reduce((a, b) => (a.id < b.id ? a : b))
})

const targetKey = computed(() => {
  const mole = currentMole.value
  if (!mole) return ''
  if (mole.kind === 'home') return mole.letter
  return targetOf(mole)[mole.progress] ?? ''
})

/** 没开打时的出怪间隔跟当前词长走。打对首字母会立刻预告，不等这个间隔。基准键不吃单词的加长。 */
function gapOf(mole?: Mole) {
  if (piece.value.kind === 'home') return homeGap()
  if (!mole || mole.kind === 'home') return gapFor(4)
  return gapFor(targetOf(mole).length)
}

function showLetter(ch: string) {
  return ch === ';' ? ';' : ch.toUpperCase()
}

function later(fn: () => void, ms: number) {
  const id = window.setTimeout(() => {
    timers.delete(id)
    if (alive) fn()
  }, ms)
  timers.add(id)
}

function emptyHoles() {
  const used = new Set(moles.value.map((m) => m.hole))
  const open: number[] = []
  for (let i = 0; i < HOLES; i++) if (!used.has(i)) open.push(i)
  return open
}

function activeLetters() {
  return new Set(moles.value.filter((m) => m.phase === 'rise' || m.phase === 'up').map((m) => m.letter))
}

function cachedPinyin(word: string) {
  const hit = pyCache.get(word)
  if (hit) return hit
  const letters = pinyinLetters(toPinyin ? toPinyin(word) : '')
  if (letters) pyCache.set(word, letters)
  return letters
}

function wordsInPlay() {
  return new Set(moles.value.filter((m) => m.phase === 'rise' || m.phase === 'up').map((m) => m.word))
}

function pickPrompt(): Omit<Mole, 'id' | 'hole' | 'left' | 'phase' | 'progress'> | null {
  const kind = piece.value.kind
  if (kind === 'home') {
    const used = activeLetters()
    const pool = HOME.filter((ch) => !used.has(ch))
    const src = pool.length ? pool : HOME
    const letter = src[Math.floor(Math.random() * src.length)]
    return { letter, kind, word: letter, gloss: '', spell: '' }
  }
  if (kind === 'en') {
    const words = englishWords(piece.value)
    if (!words.length) return null
    const used = wordsInPlay()
    let word = words[Math.floor(Math.random() * words.length)]
    for (let i = 0; i < 6 && used.has(word.en.toLowerCase()); i++) word = words[Math.floor(Math.random() * words.length)]
    const text = word.en.toLowerCase()
    if (!text) return null
    return { letter: text[0], kind, word: text, gloss: word.zh, spell: text }
  }
  const words = chineseWords(piece.value)
  if (!words.length || !toPinyin) return null
  const used = wordsInPlay()
  let word = words[Math.floor(Math.random() * words.length)]
  for (let i = 0; i < 6 && used.has(word); i++) word = words[Math.floor(Math.random() * words.length)]
  const spell = cachedPinyin(word)
  if (!spell) return null
  return { letter: spell[0], kind, word, gloss: '', spell }
}

function spawn() {
  if (activeMoles().length >= moleCap()) return
  const open = emptyHoles()
  if (!open.length) return
  const prompt = pickPrompt()
  if (!prompt) return
  const id = nextId++
  const mole: Mole = {
    id,
    hole: open[Math.floor(Math.random() * open.length)],
    ...prompt,
    left: 0,
    phase: 'rise',
    progress: 0,
  }
  mole.left = stayFor(mole.kind, targetOf(mole).length)
  moles.value.push(mole)
  requestAnimationFrame(() => {
    if (!alive) return
    const found = moles.value.find((item) => item.id === id)
    if (found && found.phase === 'rise') found.phase = 'up'
  })
}

function removeLater(id: number) {
  later(() => {
    moles.value = moles.value.filter((m) => m.id !== id)
  }, 280)
}

function flashWrong(ch: string) {
  wrongCode.value = findKeyByChar(ch)?.key.code ?? ''
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongCode.value = ''), 300)
}

function missKey(ch: string) {
  game.errors++
  game.combo = 0
  sound.error()
  flashWrong(ch)
}

function whack(mole: Mole) {
  mole.phase = 'hit'
  game.combo++
  game.hits++
  game.typedChars += targetOf(mole).length
  game.score += Math.round(10 * (1 + Math.min(game.combo, 10) * 0.1))
  if (game.hits % 8 === 0) game.level++
  sound.pop()
  removeLater(mole.id)
}

function duck(mole: Mole) {
  if (mole.phase !== 'up') return
  mole.phase = 'miss'
  game.lives = Math.max(0, game.lives - 1)
  game.combo = 0
  sound.error()
  removeLater(mole.id)
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

  for (const mole of moles.value) {
    if (mole.phase !== 'up') continue
    mole.left -= dt
    if (mole.left <= 0) duck(mole)
  }
  if (game.lives <= 0) return gameOver()

  spawnCd -= dt * 1000
  if (spawnCd <= 0) {
    const typing = activeMoles().find((m) => m.progress > 0)
    spawn()
    const active = activeMoles()
    const anchor =
      typing ?? active.reduce<Mole | undefined>((earliest, mole) => (!earliest || mole.id < earliest.id ? mole : earliest), undefined)
    spawnCd = gapOf(anchor)
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
  ch = ch.toLowerCase()
  game.keystrokes++
  const mole = currentMole.value
  if (!mole || mole.phase !== 'up') return missKey(ch)
  if (mole.kind === 'home') {
    if (mole.letter !== ch) return missKey(ch)
    whack(mole)
    return
  }
  const target = targetOf(mole)
  if (target[mole.progress] !== ch) return missKey(ch)
  const opening = mole.progress === 0
  mole.progress++
  sound.key()
  // 只在前缀从空变成 1 时立刻预告下一只。继续打不会再刷，基准键走不到这里。
  if (opening) spawn()
  if (mole.progress >= target.length) whack(mole)
}

const result = computed(() => {
  const ms = (game.endAt || Date.now()) - game.startAt
  const min = ms / 60000
  const accuracy = game.keystrokes ? Math.round(((game.keystrokes - game.errors) / game.keystrokes) * 100) : 100
  const speed = min > 0 ? Math.round(game.typedChars / 5 / min) : 0
  return { ms, accuracy, speed, unit: '词/分' }
})

function gameOver() {
  if (state.value === 'over') return
  state.value = 'over'
  game.endAt = Date.now()
  cancelAnimationFrame(raf)
  sound.fail()
  addRecord({
    kind: '打字游戏',
    title: `打地鼠 · ${piece.value.title}`,
    speed: result.value.speed,
    speedUnit: result.value.unit,
    accuracy: result.value.accuracy,
    durationMs: result.value.ms,
    score: game.score,
  })
}

async function ensurePinyin() {
  if (piece.value.kind !== 'zh') return true
  if (toPinyin) return true
  loading.value = true
  toPinyin = await loadWordPinyin()
  loading.value = false
  return alive
}

function beginRound() {
  moles.value = []
  Object.assign(game, {
    score: 0,
    lives: MAX_LIVES,
    level: 1,
    hits: 0,
    combo: 0,
    keystrokes: 0,
    errors: 0,
    typedChars: 0,
    startAt: Date.now(),
    endAt: 0,
  })
  lastTs = 0
  state.value = 'playing'
  const gen = ++loopGen
  cancelAnimationFrame(raf)
  spawn()
  spawnCd = gapOf(activeMoles()[0])
  raf = requestAnimationFrame((next) => tick(next, gen))
}

async function start() {
  if (state.value === 'playing' || catalogOpen.value) return
  if (!(await ensurePinyin())) return
  beginRound()
}

/** 和文章练习换篇一样：换到另一篇就从头打这一篇，心数和分数重计。同一篇只关掉目录。 */
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
})
</script>

<template>
  <div class="page" :class="{ 'kb-scope no-hands has-kb': settings.showKeyboard }">
    <AppHeader title="🐹 打地鼠" :subtitle="piece.source || piece.title" back="/games">
      <div class="hud">
        <span>⭐ {{ game.score }}</span>
        <span>🏅 第 {{ game.level }} 关</span>
        <span v-if="currentMole" class="aim">
          🎯
          <template v-if="currentMole.kind === 'home'">{{ showLetter(currentMole.letter) }}</template>
          <template v-else-if="currentMole.kind === 'zh'">
            {{ currentMole.word }}
            <i><b v-if="currentMole.progress" class="typed">{{ currentMole.spell.slice(0, currentMole.progress) }}</b>{{ currentMole.spell.slice(currentMole.progress) }}</i>
          </template>
          <template v-else>
            <b v-if="currentMole.progress" class="typed">{{ currentMole.word.slice(0, currentMole.progress) }}</b>{{ currentMole.word.slice(currentMole.progress) }}
            <i>{{ currentMole.gloss }}</i>
          </template>
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
      <div class="field">
        <div v-for="(mole, i) in holes" :key="i" class="hole">
          <div
            v-if="mole"
            class="mole"
            :class="[mole.phase, { urgent: !!currentMole && mole.id === currentMole.id && mole.phase === 'up' && mole.left < 0.7 }]"
          >
            <div class="sign" :class="{ card: mole.kind !== 'home' }">
              <template v-if="mole.phase === 'hit'">💥</template>
              <template v-else-if="mole.kind === 'home'">{{ showLetter(mole.letter) }}</template>
              <template v-else-if="mole.kind === 'zh'">
                <span class="word">{{ mole.word }}</span>
                <span class="spell">
                  <b v-if="mole.progress" class="typed">{{ mole.spell.slice(0, mole.progress) }}</b>{{ mole.spell.slice(mole.progress) }}
                </span>
              </template>
              <template v-else>
                <span class="spell">
                  <b v-if="mole.progress" class="typed">{{ mole.word.slice(0, mole.progress) }}</b>{{ mole.word.slice(mole.progress) }}
                </span>
                <span class="gloss">{{ mole.gloss }}</span>
              </template>
            </div>
            <div class="face">🐹</div>
          </div>
          <div class="pit" />
        </div>
      </div>

      <div v-if="state === 'ready'" class="overlay">
        <div class="card start">
          <h2>🐹 打地鼠</h2>
          <p v-if="piece.kind === 'home'">地鼠举着基准键字母冒出来。打出你看见的字母就能打到它，缩回洞里会丢一颗心。</p>
          <p v-else-if="piece.kind === 'en'">地鼠举着英文单词，下面是中文意思。打出完整单词才算打中，已经打对的字母会高亮。打错不计入。</p>
          <p v-else>地鼠举着汉字和拼音。打出完整拼音才算打中（不标声调，ü 用 v），已经打对的拼音会高亮。打错不计入。</p>
          <p class="now">当前：{{ piece.title }}</p>
          <div class="actions">
            <button class="btn" type="button" @click="catalogOpen = true">📚 目录</button>
            <button class="btn primary" type="button" :disabled="loading" @click="start">
              {{ loading ? '加载中…' : '按空格键开始' }}
            </button>
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
      title="🐹 打地鼠"
      :items="MOLE_CATALOG"
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
  color: var(--primary-dark);
}

.aim i {
  margin-left: 6px;
  font-style: normal;
  font-family: -apple-system, 'PingFang SC', sans-serif;
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

.field {
  flex: 1;
  min-height: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 6px 4%;
  padding: 8px 6% 4px;
  border-radius: 24px;
  overflow: hidden;
  background:
    radial-gradient(circle at 18% 24%, rgb(255 255 255 / 0.2) 0 8px, transparent 9px),
    radial-gradient(circle at 78% 62%, rgb(255 255 255 / 0.14) 0 10px, transparent 11px),
    linear-gradient(180deg, #86efac 0%, #4ade80 58%, #65a30d 100%);
}

.hole {
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.mole {
  position: absolute;
  left: 50%;
  bottom: 16%;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%) translateY(120%);
  transition: transform 0.16s ease-out;
}

.mole.up {
  transform: translateX(-50%) translateY(0);
}

.sign {
  min-width: 36px;
  padding: 1px 8px;
  border-radius: 10px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  font-family: Menlo, monospace;
  font-size: clamp(18px, 3.2vh, 32px);
  font-weight: 800;
  text-align: center;
  color: #1e293b;
}

.sign.card {
  font-family: -apple-system, 'PingFang SC', sans-serif;
  padding: 4px 8px 5px;
  max-width: 100%;
}

.word,
.spell,
.gloss {
  display: block;
  line-height: 1.15;
}

.word {
  font-size: clamp(16px, 2.4vh, 22px);
}

.spell {
  font-family: Menlo, monospace;
  font-size: clamp(13px, 1.9vh, 18px);
  letter-spacing: 0.04em;
}

.gloss {
  font-style: normal;
  font-weight: 700;
}

.typed {
  color: #16a34a;
  background: #dcfce7;
  border-radius: 3px;
  font-weight: 800;
}

.gloss {
  font-size: clamp(12px, 1.6vh, 14px);
  color: #64748b;
  font-weight: 600;
}

.face {
  font-size: clamp(28px, 5.4vh, 52px);
  line-height: 1;
  margin-top: -2px;
}

.mole.urgent .sign {
  background: #fef3c7;
  animation: wobble 0.35s ease-in-out infinite;
}

.pit {
  position: absolute;
  z-index: 2;
  left: 14%;
  right: 14%;
  bottom: 8%;
  height: 24%;
  border-radius: 50%;
  background: radial-gradient(ellipse at center, #3f2a1d 0%, #78350f 72%);
  box-shadow: inset 0 6px 8px rgb(0 0 0 / 0.35);
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(255 255 255 / 0.35);
  z-index: 3;
}

.start {
  padding: 28px 40px;
  text-align: center;
  max-width: min(520px, 92%);
}

.start h2 {
  margin: 0 0 8px;
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
}

.kb-wrap {
  display: flex;
  justify-content: center;
  padding: 0 var(--page-pad) var(--page-pad);
  flex-shrink: 0;
}

@keyframes wobble {
  50% {
    transform: rotate(-6deg);
  }
}
</style>
