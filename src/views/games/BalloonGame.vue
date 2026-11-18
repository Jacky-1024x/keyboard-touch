<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import { sound } from '@/core/sound'
import { addRecord } from '@/stores/records'
import { ALL_WORDS } from '@/data/words-en'
import { ZH_GAME_WORDS } from '@/data/words-zh'

type Mode = 'letter' | 'word' | 'zh-en' | 'pinyin'

const props = defineProps<{ mode: Mode }>()
const router = useRouter()

const MODE_TITLES: Record<Mode, string> = {
  letter: '字母气球',
  word: '单词气球',
  'zh-en': '看中文打英文',
  pinyin: '拼音气球',
}
const COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6']
const MAX_LIVES = 5

interface Balloon {
  id: number
  /** 气球上的主文字 */
  label: string
  /** 小字提示（中文释义 / 拼音） */
  sub?: string
  target: string
  /** 横向位置 % */
  x: number
  /** 0=底部 1=顶部 */
  y: number
  color: string
  popped: boolean
}

const state = ref<'loading' | 'ready' | 'playing' | 'over'>('loading')
const balloons = ref<Balloon[]>([])
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
const buffer = ref('')
const lockedId = ref<number | null>(null)
let toPinyin: ((w: string) => string) | null = null
let nextId = 1
let raf = 0
let lastTs = 0
let spawnCd = 0

/**
 * 关卡难度曲线（缓坡，越往后略难）：
 * - 上升速度：第 1 关保持较慢，之后每关只加一点，并设上限
 * - 同屏数量：第 1 关 3 个，每两关才多 1 个，最多 8 个
 * - 生成间隔：慢慢变密，避免一关之内就把屏幕挤满
 */
const speedPerSec = computed(() => Math.min(0.16, 0.055 + (game.level - 1) * 0.008))
const spawnInterval = computed(() => Math.max(1200, 2500 - (game.level - 1) * 80))
const maxBalloons = computed(() => Math.min(8, 3 + Math.floor((game.level - 1) / 2)))
const isPinyin = computed(() => props.mode === 'pinyin')

function makeItem(): Pick<Balloon, 'label' | 'sub' | 'target'> {
  switch (props.mode) {
    case 'letter': {
      const ch = String.fromCharCode(97 + Math.floor(Math.random() * 26))
      return { label: ch.toUpperCase(), target: ch }
    }
    case 'word': {
      const w = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]
      return { label: w.en, sub: w.zh, target: w.en }
    }
    case 'zh-en': {
      const w = ALL_WORDS[Math.floor(Math.random() * ALL_WORDS.length)]
      return { label: w.zh, sub: `${w.en[0]}${'_'.repeat(w.en.length - 1)}`, target: w.en }
    }
    case 'pinyin': {
      const pool = game.level <= 2 ? ZH_GAME_WORDS.filter((w) => w.length === 1) : ZH_GAME_WORDS
      const w = pool[Math.floor(Math.random() * pool.length)]
      const py = toPinyin!(w)
      // 第 1 关给出拼音提示，之后只看汉字
      return { label: w, sub: game.level === 1 ? py : undefined, target: py }
    }
  }
}

function spawn() {
  const alive = balloons.value.filter((b) => !b.popped)
  if (alive.length >= maxBalloons.value) return
  // 避免同一首字母的气球同时出现，减少歧义
  let item = makeItem()
  for (let i = 0; i < 5 && alive.some((b) => b.target[0] === item.target[0]); i++) item = makeItem()
  balloons.value.push({
    id: nextId++,
    ...item,
    x: 6 + Math.random() * 82,
    y: 0,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    popped: false,
  })
}

function tick(ts: number) {
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0
  lastTs = ts
  if (state.value !== 'playing') return

  spawnCd -= dt * 1000
  if (spawnCd <= 0) {
    spawn()
    spawnCd = spawnInterval.value
  }

  for (const b of balloons.value) {
    if (b.popped) continue
    b.y += speedPerSec.value * dt
    if (b.y >= 1) {
      b.popped = true
      game.lives--
      game.combo = 0
      sound.error()
      if (lockedId.value === b.id) resetLock()
      removeLater(b.id)
    }
  }
  if (game.lives <= 0) return gameOver()
  raf = requestAnimationFrame(tick)
}

/** y=0 时气球刚从底部露出大半，y=1 时顶到天空上沿 */
function balloonTop(y: number) {
  return `calc(${(1 - y) * 100}% - ${(1 - y) * 120}px)`
}

function removeLater(id: number) {
  setTimeout(() => (balloons.value = balloons.value.filter((b) => b.id !== id)), 300)
}

function resetLock() {
  lockedId.value = null
  buffer.value = ''
}

function onChar(ch: string) {
  if (state.value === 'ready' && ch === ' ') return start()
  if (state.value !== 'playing') return
  if (ch === ' ') return
  ch = ch.toLowerCase()
  game.keystrokes++

  let target = balloons.value.find((b) => b.id === lockedId.value && !b.popped)
  if (!target) {
    // 选最高（最危险）的、首字母匹配的气球
    target = balloons.value
      .filter((b) => !b.popped && b.target[0] === ch)
      .sort((a, b) => b.y - a.y)[0]
    if (!target) return miss()
    lockedId.value = target.id
    buffer.value = ''
  }

  if (target.target[buffer.value.length] !== ch) return miss()
  buffer.value += ch
  sound.key()
  if (buffer.value === target.target) pop(target)
}

function miss() {
  game.errors++
  game.combo = 0
  sound.error()
}

function pop(b: Balloon) {
  b.popped = true
  game.combo++
  game.popped++
  game.typedChars += b.target.length
  if (isPinyin.value) game.hanzi += b.label.length
  game.score += Math.round(b.target.length * 10 * (1 + Math.min(game.combo, 10) * 0.1))
  if (game.popped % 8 === 0) game.level++
  sound.pop()
  resetLock()
  removeLater(b.id)
}

function start() {
  balloons.value = []
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
  resetLock()
  spawnCd = 0
  lastTs = 0
  state.value = 'playing'
  cancelAnimationFrame(raf)
  raf = requestAnimationFrame(tick)
}

const result = computed(() => {
  const ms = (game.endAt || Date.now()) - game.startAt
  const min = ms / 60000
  const accuracy = game.keystrokes ? Math.round(((game.keystrokes - game.errors) / game.keystrokes) * 100) : 100
  const speed = min > 0 ? Math.round(isPinyin.value ? game.hanzi / min : game.typedChars / 5 / min) : 0
  return { ms, accuracy, speed, unit: isPinyin.value ? '字/分' : '词/分' }
})

function gameOver() {
  state.value = 'over'
  game.endAt = Date.now()
  cancelAnimationFrame(raf)
  sound.fail()
  addRecord({
    kind: '打字游戏',
    title: `气球大作战 · ${MODE_TITLES[props.mode]}`,
    speed: result.value.speed,
    speedUnit: result.value.unit,
    accuracy: result.value.accuracy,
    durationMs: result.value.ms,
    score: game.score,
  })
}

function goBack() {
  router.push('/games')
}

useKeyboardInput({
  onChar,
  onBackspace: () => resetLock(),
  onEnter: () => (state.value === 'over' || state.value === 'ready') && start(),
  onEscape: goBack,
})

onMounted(async () => {
  if (isPinyin.value) toPinyin = (await import('@/core/pinyin')).wordToPinyin
  state.value = 'ready'
})
onBeforeUnmount(() => cancelAnimationFrame(raf))
</script>

<template>
  <div class="page">
    <AppHeader :title="`🎈 ${MODE_TITLES[mode]}`" back="/games">
      <div class="hud">
        <span>⭐ {{ game.score }}</span>
        <span>🏅 第 {{ game.level }} 关 · 最多{{ maxBalloons }}球</span>
        <span v-if="game.combo > 1" class="combo">🔥 连击 ×{{ game.combo }}</span>
        <span class="lives">
          <i v-for="i in MAX_LIVES" :key="i" :class="{ lost: i > game.lives }">❤️</i>
        </span>
      </div>
    </AppHeader>

    <main class="sky">
      <div
        v-for="b in balloons"
        :key="b.id"
        class="balloon"
        :class="{ popped: b.popped, locked: b.id === lockedId }"
        :style="{ left: `${b.x}%`, top: balloonTop(b.y), '--c': b.color }"
      >
        <div class="body">
          <span class="label">{{ b.label }}</span>
          <span v-if="b.sub && mode !== 'letter'" class="sub">{{ b.sub }}</span>
          <span v-if="b.id === lockedId" class="typed">
            <b>{{ buffer }}</b>{{ b.target.slice(buffer.length) }}
          </span>
        </div>
        <div class="string" />
      </div>

      <div v-if="state === 'ready' || state === 'loading'" class="overlay">
        <div class="card start">
          <h2>🎈 {{ MODE_TITLES[mode] }}</h2>
          <p v-if="mode === 'pinyin'">看汉字，打出拼音（不用打声调，ü 用 v）</p>
          <p v-else-if="mode === 'zh-en'">看中文，打出英文单词</p>
          <p v-else>打出气球上的{{ mode === 'letter' ? '字母' : '单词' }}，别让气球飞走！</p>
          <button class="btn primary" :disabled="state === 'loading'" @click="start">
            {{ state === 'loading' ? '加载中…' : '按空格键开始' }}
          </button>
        </div>
      </div>
    </main>

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
  </div>
</template>

<style scoped>
.hud {
  display: flex;
  align-items: center;
  gap: 20px;
  font-size: 18px;
  font-weight: 700;
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

.sky {
  position: relative;
  flex: 1;
  margin: 0 var(--page-pad) var(--page-pad);
  border-radius: 24px;
  overflow: hidden;
  background: linear-gradient(180deg, #7dd3fc 0%, #bae6fd 60%, #dcfce7 100%);
}

.balloon {
  position: absolute;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: opacity 0.3s, transform 0.3s;
  will-change: top;
}

.body {
  min-width: 96px;
  min-height: 110px;
  padding: 12px 16px;
  border-radius: 50% 50% 48% 48% / 55% 55% 45% 45%;
  background: radial-gradient(circle at 30% 30%, rgb(255 255 255 / 0.6), transparent 40%), var(--c);
  box-shadow: inset -6px -10px 16px rgb(0 0 0 / 0.15);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #1e293b;
}

.label {
  font-size: 30px;
  font-weight: 800;
  white-space: nowrap;
}

.sub {
  font-size: 15px;
  opacity: 0.8;
  white-space: nowrap;
}

.typed {
  margin-top: 4px;
  padding: 0 8px;
  border-radius: 8px;
  background: rgb(255 255 255 / 0.85);
  font-family: Menlo, monospace;
  font-size: 18px;
  color: #94a3b8;
}

.typed b {
  color: #16a34a;
}

.balloon.locked .body {
  outline: 4px solid #fff;
}

.string {
  width: 2px;
  height: 40px;
  background: rgb(30 41 59 / 0.4);
}

.balloon.popped {
  opacity: 0;
  transform: translateX(-50%) scale(1.5);
}

.overlay {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  background: rgb(255 255 255 / 0.3);
}

.start {
  padding: 32px 48px;
  text-align: center;
}

.start h2 {
  margin: 0 0 8px;
  font-size: 30px;
}

.start p {
  color: var(--muted);
  margin: 0 0 20px;
}
</style>
