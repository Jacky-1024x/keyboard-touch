<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import ResultDialog from '@/components/ResultDialog.vue'
import TypingText from '@/components/TypingText.vue'
import {
  CHASE_CATEGORIES,
  listPieces,
  segmentsFor,
  type ChaseCategory,
  type ChasePiece,
} from '@/core/chase-content'
import {
  FACING_DEG,
  MAZE_COUNT,
  MAZES,
  facingOnPath,
  pointOnPath,
} from '@/core/mazes'
import { sound } from '@/core/sound'
import { useTypingSession } from '@/core/typing-session'
import { useKeyboardInput } from '@/core/use-keyboard-input'
import { addRecord } from '@/stores/records'

type Phase = 'list' | 'setup' | 'loading' | 'play' | 'over'
type EndReason = 'clear' | 'text'
type RunMode = 'one' | 'multi'

/** 最近这么多秒里的正确键，用来让跑动快慢跟着打字速度走。路程本身只跟打对的键数有关。 */
const HIT_WINDOW_SEC = 2.5
const SMOOTH_TAU = 0.4
const EAT_MS = 520
const HOLD_MS = 260
/** 打对一个键前进 1/KEYS_PER_CELL 间。原先一键一间，先改成三分之一。 */
const KEYS_PER_CELL = 3

const router = useRouter()
const session = useTypingSession({ mode: 'block' })
const { segments, cells, index, expected, finished, load, input } = session

const phase = ref<Phase>('list')
const category = ref<ChaseCategory | null>(null)
const mode = ref<RunMode>('multi')
const loadError = ref('')
const busy = ref(false)
const runPieces = ref<ChasePiece[]>([])
const runMode = ref<RunMode>('multi')
const pieceIndex = ref(0)
const levelIndex = ref(0)
const clearedCount = ref(0)
const earned = ref(0)
const displayPac = ref(0)
const eating = ref(false)
const raceOn = ref(false)
const textExhausted = ref(false)
const smoothCps = ref(0)
const wrongFlash = ref(false)
const toast = ref('')

const outcome = ref<{
  reason: EndReason
  cleared: number
  speed: number
  unit: string
  accuracy: number
  ms: number
  score: number
} | null>(null)

const categoryCards = CHASE_CATEGORIES.map((item) => ({
  ...item,
  count: listPieces(item.id).length,
}))

const pieces = computed(() => (category.value ? listPieces(category.value.id) : []))
const grouped = computed(() => {
  const groups: { name: string; items: ChasePiece[] }[] = []
  for (const piece of pieces.value) {
    const last = groups[groups.length - 1]
    if (!last || last.name !== piece.group) groups.push({ name: piece.group, items: [piece] })
    else last.items.push(piece)
  }
  return groups
})

const maze = computed(() => MAZES[levelIndex.value] ?? MAZES[0])
const need = computed(() => Math.max(1, maze.value.path.length - 1 - maze.value.gap))
const traveled = computed(() => Math.floor(earned.value))
const rooms = computed(() => {
  const level = maze.value
  const start = level.path[0]
  const goal = level.path[level.path.length - 1]
  const cells: {
    n: boolean
    s: boolean
    e: boolean
    w: boolean
    entrance: boolean
    exit: boolean
  }[] = []
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols; c++) {
      const entrance = r === start.r && c === start.c
      const exit = r === goal.r && c === goal.c
      cells.push({
        n: r === 0,
        s: r === level.rows - 1,
        w: c === 0 && !entrance,
        e: c === level.cols - 1 && !exit,
        entrance,
        exit,
      })
    }
  }
  return cells
})

/** 内墙只画到交叉点。端点落在墙线上，方头线帽补齐拐角，不会穿出另一边。 */
const innerLines = computed(() => {
  const level = maze.value
  const rim = 0.2
  const lines: { x1: number; y1: number; x2: number; y2: number }[] = []
  const clip = (v: number, max: number) => (v <= 0 ? rim : v >= max ? max - rim : v)
  for (let r = 0; r < level.rows - 1; r++) {
    for (let c = 0; c < level.cols; c++) {
      if (level.down[r][c]) continue
      lines.push({
        x1: clip(c, level.cols),
        y1: r + 1,
        x2: clip(c + 1, level.cols),
        y2: r + 1,
      })
    }
  }
  for (let r = 0; r < level.rows; r++) {
    for (let c = 0; c < level.cols - 1; c++) {
      if (level.right[r][c]) continue
      lines.push({
        x1: c + 1,
        y1: clip(r, level.rows),
        x2: c + 1,
        y2: clip(r + 1, level.rows),
      })
    }
  }
  return lines
})

const trailPoints = computed(() => {
  const path = maze.value.path
  const t = displayPac.value
  if (t <= 0.02) return ''
  const last = Math.min(path.length - 1, Math.floor(t))
  const pts = path.slice(0, last + 1).map((cell) => `${cell.c + 0.5},${cell.r + 0.5}`)
  const head = pointOnPath(path, t)
  const prev = path[last]
  if (Math.abs(head.c - prev.c) + Math.abs(head.r - prev.r) > 0.01) {
    pts.push(`${head.c + 0.5},${head.r + 0.5}`)
  }
  return pts.join(' ')
})

const pacFloor = computed(() => Math.floor(displayPac.value))
const beanIndex = computed(() => {
  const end = maze.value.path.length - 1
  if (eating.value) return end
  return Math.min(end, displayPac.value + maze.value.gap)
})
const pacPos = computed(() => pointOnPath(maze.value.path, displayPac.value))
const beanPos = computed(() => pointOnPath(maze.value.path, beanIndex.value))
const pacFacing = computed(() => facingOnPath(maze.value.path, eating.value ? maze.value.path.length - 1.2 : displayPac.value))
const beanFacing = computed(() => facingOnPath(maze.value.path, beanIndex.value))
const bitten = computed(() => {
  if (!eating.value) return false
  return displayPac.value >= maze.value.path.length - 1 - 0.35
})
const moving = computed(() => eating.value || (raceOn.value && earned.value - displayPac.value > 0.04))
const chomping = computed(() => phase.value === 'play' && (raceOn.value || eating.value))
const chompDuration = computed(() => {
  if (eating.value) return '0.08s'
  if (!moving.value) return '0.46s'
  return `${Math.max(0.09, Math.min(0.26, 0.48 / Math.max(1, smoothCps.value)))}s`
})

const currentPiece = computed(() => runPieces.value[pieceIndex.value])
const headerSub = computed(() => {
  if ((phase.value === 'play' || phase.value === 'over') && category.value) {
    return `${category.value.title} · 第 ${levelIndex.value + 1}/${MAZE_COUNT} 关`
  }
  if (phase.value === 'setup' && category.value) return `${category.value.title} · 先选怎么打`
  return '选好内容，吃豆人就开始追'
})
const expectLabel = computed(() => {
  const ch = expected.value
  if (!ch) return '完成'
  if (ch === ' ') return '空格'
  return ch
})
const needsShift = computed(() => /^[A-Z]$/.test(expected.value))
const gapText = computed(() => (eating.value ? '要吃到了' : `相距 ${maze.value.gap} 间`))
const statusText = computed(() => {
  if (eating.value) return '豆子到出口了'
  if (!raceOn.value) return '打对第一个键就出发'
  if (smoothCps.value < 0.2) return '停下来了'
  return '在追'
})
const endTitle = computed(() => {
  if (!outcome.value) return ''
  if (outcome.value.reason === 'clear') return '一百关全部吃完了！'
  if (outcome.value.cleared > 0) return `内容打完了，过了 ${outcome.value.cleared} 关`
  return '字打完了，豆子还在前面'
})

const stageStyle = computed(() => ({
  '--cols': maze.value.cols,
  '--rows': maze.value.rows,
}))

let raf = 0
let lastTs = 0
let wrongTimer = 0
let toastTimer = 0
let loadToken = 0
let correctCells = 0
let hanziDone = 0
let keystrokes = 0
let errors = 0
let statsStart = 0
let eatStart = 0
let eatFrom = 0
let bitOnce = false
let ready = false
let pending = 0
let progressKeys = 0
let stumbleUntil = 0
const hits: number[] = []

function stopLoop() {
  cancelAnimationFrame(raf)
  raf = 0
}

function resetRun() {
  levelIndex.value = 0
  clearedCount.value = 0
  earned.value = 0
  displayPac.value = 0
  eating.value = false
  raceOn.value = false
  textExhausted.value = false
  smoothCps.value = 0
  wrongFlash.value = false
  toast.value = ''
  outcome.value = null
  ready = false
  pending = 0
  progressKeys = 0
  eatStart = 0
  eatFrom = 0
  bitOnce = false
  stumbleUntil = 0
  hits.length = 0
  correctCells = 0
  hanziDone = 0
  keystrokes = 0
  errors = 0
  statsStart = 0
  lastTs = 0
}

function showToast(text: string) {
  toast.value = text
  window.clearTimeout(toastTimer)
  toastTimer = window.setTimeout(() => {
    toast.value = ''
  }, 800)
}

function openCategory(cat: ChaseCategory) {
  category.value = cat
  mode.value = 'multi'
  loadError.value = ''
  phase.value = 'setup'
  if (cat.kind === 'zh') void import('@/core/pinyin')
}

async function loadCurrent() {
  const cat = category.value
  const piece = runPieces.value[pieceIndex.value]
  if (!cat || !piece) return false
  const token = ++loadToken
  const segs = await segmentsFor(cat.id, piece.id)
  if (token !== loadToken) return false
  load(segs)
  return cells.value.length > 0
}

async function begin(list: ChasePiece[], nextMode: RunMode) {
  if (!category.value || !list.length || busy.value) return
  busy.value = true
  loadError.value = ''
  stopLoop()
  runPieces.value = list
  runMode.value = nextMode
  pieceIndex.value = 0
  resetRun()
  phase.value = 'loading'
  const ok = await loadCurrent()
  busy.value = false
  if (phase.value !== 'loading') return
  if (!ok) {
    phase.value = 'setup'
    loadError.value = '这篇暂时没有可以打的内容'
    return
  }
  phase.value = 'play'
  raf = requestAnimationFrame(tick)
}

function startMulti() {
  void begin(pieces.value, 'multi')
}

function noteCompletedSegment() {
  if (!category.value?.hanzi) return
  const cursor = index.value
  const prev = cells.value[cursor - 1]
  if (!prev || prev.sep) return
  const more = cells.value.slice(cursor).some((cell) => cell.seg === prev.seg && !cell.sep)
  if (!more) hanziDone += 1
}

function adaptChar(ch: string, expect: string) {
  if (category.value?.kind === 'en') return ch
  if (/^[a-z]$/i.test(expect) && /^[a-z]$/i.test(ch)) return ch.toLowerCase()
  return ch
}

function ensureStarted(now: number) {
  if (raceOn.value) return
  raceOn.value = true
  statsStart = Date.now()
  lastTs = now
}

function windowCps(now: number) {
  const cutoff = now - HIT_WINDOW_SEC * 1000
  while (hits.length && hits[0] < cutoff) hits.shift()
  return hits.length / HIT_WINDOW_SEC
}

/** 打对的键换成路程：一键只走三分之一间。豆子到出口之后多出来的键，留给下一关。 */
function applyProgress(keys: number) {
  if (keys <= 0 || phase.value !== 'play') return
  if (eating.value || ready) {
    pending += keys
    return
  }
  const room = need.value * KEYS_PER_CELL - progressKeys
  if (keys >= room) {
    pending += keys - room
    progressKeys += room
    earned.value = need.value
    ready = true
    return
  }
  progressKeys += keys
  earned.value = progressKeys / KEYS_PER_CELL
}

function onChar(ch: string) {
  if (phase.value !== 'play' || !expected.value) return
  const fb = input(adaptChar(ch, expected.value))
  if (fb === 'ignored') return
  keystrokes += 1
  if (fb === 'correct') {
    correctCells += 1
    noteCompletedSegment()
    const now = performance.now()
    ensureStarted(now)
    hits.push(now)
    wrongFlash.value = false
    applyProgress(1)
    sound.key()
    return
  }
  errors += 1
  stumbleUntil = performance.now() + 180
  wrongFlash.value = true
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongFlash.value = false), 220)
  sound.error()
}

function tick(ts: number) {
  if (phase.value !== 'play') return
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0
  lastTs = ts
  if (raceOn.value) {
    const sample = windowCps(ts)
    smoothCps.value += (sample - smoothCps.value) * (1 - Math.exp(-dt / SMOOTH_TAU))
  }

  const end = maze.value.path.length - 1
  if (eating.value) {
    const t = Math.min(1, (ts - eatStart) / EAT_MS)
    const eased = 1 - (1 - t) ** 3
    displayPac.value = eatFrom + (end - eatFrom) * eased
    if (t >= 1) {
      displayPac.value = end
      if (!bitOnce) {
        bitOnce = true
        sound.pop()
      }
      if (ts - eatStart >= EAT_MS + HOLD_MS) {
        completeLevel()
        if (phase.value !== 'play') return
      }
    }
  } else if (ts >= stumbleUntil) {
    const lag = earned.value - displayPac.value
    if (lag > 0.001) {
      const speed = Math.max(8 / KEYS_PER_CELL, smoothCps.value * 1.35 / KEYS_PER_CELL, (lag * 7) / KEYS_PER_CELL)
      displayPac.value = Math.min(earned.value, displayPac.value + speed * dt)
    }
    if (ready && displayPac.value >= earned.value - 0.02) {
      eating.value = true
      ready = false
      eatFrom = displayPac.value
      eatStart = ts
      bitOnce = false
    }
  }

  raf = requestAnimationFrame(tick)
}

function completeLevel() {
  if (phase.value !== 'play') return
  clearedCount.value += 1
  eating.value = false
  ready = false
  const extra = pending
  pending = 0
  if (clearedCount.value >= MAZE_COUNT) {
    finishGame('clear')
    return
  }
  if (textExhausted.value && extra <= 0) {
    earned.value = 0
    progressKeys = 0
    finishGame('text')
    return
  }
  levelIndex.value += 1
  earned.value = 0
  progressKeys = 0
  displayPac.value = 0
  showToast(`第 ${clearedCount.value} 关吃到了`)
  if (extra > 0) applyProgress(extra)
  if (textExhausted.value && !eating.value && !ready) finishGame('text')
}

function finishGame(reason: EndReason) {
  if (phase.value !== 'play' || !category.value) return
  phase.value = 'over'
  stopLoop()
  const partialNeed = Math.max(1, maze.value.path.length - 1 - maze.value.gap)
  const partial =
    reason === 'clear' ? 0 : Math.min(99, Math.floor((earned.value / partialNeed) * 100))
  const score = reason === 'clear' ? MAZE_COUNT * 100 : clearedCount.value * 100 + partial
  const ms = statsStart ? Date.now() - statsStart : 0
  const minutes = ms / 60000
  const hanzi = category.value.hanzi
  const speed = minutes > 0 ? Math.round(hanzi ? hanziDone / minutes : correctCells / 5 / minutes) : 0
  const accuracy = keystrokes ? Math.max(0, Math.round(((keystrokes - errors) / keystrokes) * 100)) : 100
  const unit = hanzi ? '字/分' : '词/分'
  outcome.value = { reason, cleared: clearedCount.value, speed, accuracy, ms, unit, score }
  if (reason === 'clear' || clearedCount.value > 0) sound.success()
  else sound.fail()
  addRecord({
    kind: '打字游戏',
    title: `迷宫吃豆 · ${category.value.title}`,
    speed,
    speedUnit: unit,
    accuracy,
    durationMs: ms,
    score,
  })
}

function again() {
  if (!runPieces.value.length) return
  void begin(runPieces.value, runMode.value)
}

function backToSetup() {
  stopLoop()
  loadToken += 1
  outcome.value = null
  phase.value = category.value ? 'setup' : 'list'
}

function onEscape() {
  if (phase.value === 'play' || phase.value === 'over' || phase.value === 'loading') {
    backToSetup()
    return
  }
  if (phase.value === 'setup') {
    phase.value = 'list'
    return
  }
  router.push('/games')
}

watch(finished, async (done) => {
  if (!done || phase.value !== 'play') return
  if (runMode.value === 'multi' && pieceIndex.value < runPieces.value.length - 1) {
    pieceIndex.value += 1
    const ok = await loadCurrent()
    if (!ok && phase.value === 'play') textExhausted.value = true
    if (textExhausted.value && phase.value === 'play' && !eating.value && !ready) finishGame('text')
    return
  }
  textExhausted.value = true
  if (!eating.value && !ready) finishGame('text')
})

useKeyboardInput({
  onChar,
  onEnter: () => {
    if (phase.value === 'over') again()
  },
  onEscape,
})

onBeforeUnmount(() => {
  stopLoop()
  window.clearTimeout(wrongTimer)
  window.clearTimeout(toastTimer)
})
</script>

<template>
  <div class="page">
    <AppHeader title="🟡 迷宫吃豆" :subtitle="headerSub" back="/games" />

    <div v-if="phase === 'list'" class="page-body">
      <p class="lead">先选要打的内容。英文打原文，中文打拼音。吃豆人跟着你的字，在迷宫里追那颗豆。</p>
      <div class="grid-cards">
        <button v-for="cat in categoryCards" :key="cat.id" type="button" class="card pick" @click="openCategory(cat)">
          <span class="icon">{{ cat.icon }}</span>
          <b>{{ cat.title }}</b>
          <span class="desc">{{ cat.card }}</span>
          <span class="count">{{ cat.count }} {{ cat.unit }}</span>
        </button>
      </div>
    </div>

    <div v-else-if="phase === 'setup'" class="page-body">
      <div class="card panel">
        <p class="how">{{ category?.how }}</p>
        <p class="rule">
          迷宫一共 {{ MAZE_COUNT }} 关，开局前就生成好了。每一关都是长方形，入口在左边，出口在右边。吃豆人的嘴一直在张合，豆子在前面跑。
        </p>
        <p class="rule">
          每打对一个键，两人都沿路往前三分之一间。打得越快，跑得越快；停手就停下。打错会顿一下，人不往前。到出口之前，两人沿路始终相距
          {{ MAZES[0].gap }} 间。豆子一进出口就站住，吃豆人自己追上去吃掉，这一关结束，马上进入下一关。
        </p>
        <div class="modes">
          <button type="button" class="btn" :class="{ on: mode === 'multi' }" @click="mode = 'multi'">连续多篇</button>
          <button type="button" class="btn" :class="{ on: mode === 'one' }" @click="mode = 'one'">只打一篇</button>
          <button type="button" class="btn" @click="phase = 'list'">返回类别</button>
        </div>
        <p v-if="loadError" class="error">{{ loadError }}</p>
      </div>

      <div v-if="mode === 'multi'" class="card panel">
        <p>
          从第一篇按顺序接到最后，共 {{ pieces.length }} {{ category?.unit }}。打完一篇马上下一篇，迷宫接着往下走。一百关都吃完，或者这些内容打完，这一局就结束。
        </p>
        <button type="button" class="btn primary" :disabled="!pieces.length || busy" @click="startMulti">开始追豆</button>
      </div>

      <div v-else class="pieces">
        <template v-for="group in grouped" :key="group.name || 'all'">
          <h3 v-if="group.name" class="group-title">{{ group.name }}</h3>
          <button v-for="piece in group.items" :key="piece.id" type="button" class="piece" @click="begin([piece], 'one')">
            <span>
              <b>{{ piece.title }}</b>
              <small v-if="piece.source">{{ piece.source }}</small>
            </span>
            <em>{{ piece.level }} 级</em>
          </button>
        </template>
      </div>
    </div>

    <div v-else-if="phase === 'loading'" class="page-body">
      <div class="card panel">正在摆好迷宫…</div>
    </div>

    <div v-else class="play">
      <div class="board">
        <div class="stage" :style="stageStyle">
          <div
            class="maze"
            :style="{
              gridTemplateColumns: `repeat(${maze.cols}, 1fr)`,
              gridTemplateRows: `repeat(${maze.rows}, 1fr)`,
            }"
          >
            <div
              v-for="(cell, i) in rooms"
              :key="`${maze.id}-${i}`"
              class="room"
              :class="{ exit: cell.exit, entrance: cell.entrance }"
            >
              <i v-if="cell.n" class="edge n outer" />
              <i v-if="cell.s" class="edge s outer" />
              <i v-if="cell.w" class="edge w outer" />
              <i v-if="cell.e" class="edge e outer" />
              <span v-if="cell.entrance" class="mark in">入</span>
              <span v-if="cell.exit" class="mark out">出</span>
            </div>
            <svg class="lines" :viewBox="`0 0 ${maze.cols} ${maze.rows}`" preserveAspectRatio="none">
              <line
                v-for="(line, i) in innerLines"
                :key="`${maze.id}-w-${i}`"
                :x1="line.x1"
                :y1="line.y1"
                :x2="line.x2"
                :y2="line.y2"
              />
            </svg>
          </div>
          <div class="actors">
            <svg
              v-if="trailPoints"
              class="trail"
              :viewBox="`0 0 ${maze.cols} ${maze.rows}`"
              preserveAspectRatio="none"
            >
              <polyline :points="trailPoints" />
            </svg>
            <i
              v-for="(cell, i) in maze.path"
              v-show="i > pacFloor && i < maze.path.length - 1"
              :key="`${maze.id}-p-${i}`"
              class="pellet"
              :style="{ '--c': cell.c, '--r': cell.r }"
            />
            <div class="runner bean" :class="[beanFacing, { moving, bitten }]">
              <div class="bean-body" :style="{ '--c': beanPos.c, '--r': beanPos.r }">
                <span class="eyes"><i /><i /></span>
              </div>
            </div>
            <div class="runner pac" :class="{ shake: wrongFlash }">
              <div
                class="face"
                :class="{ chomp: chomping }"
                :style="{
                  '--c': pacPos.c,
                  '--r': pacPos.r,
                  '--turn': `${FACING_DEG[pacFacing]}deg`,
                  animationDuration: chompDuration,
                }"
              />
              <i class="pupil" :class="pacFacing" :style="{ '--c': pacPos.c, '--r': pacPos.r }" />
            </div>
          </div>
          <p v-if="toast" class="toast">{{ toast }}</p>
        </div>
      </div>

      <div class="dock">
        <div class="hud">
          <b>第 {{ levelIndex + 1 }}/{{ MAZE_COUNT }} 关</b>
          <span>本关 {{ traveled }}/{{ need }}</span>
          <span>{{ gapText }}</span>
          <span>{{ statusText }}</span>
          <b class="piece-name">{{ currentPiece?.title }}</b>
          <span>{{ smoothCps.toFixed(1) }} 下/秒</span>
        </div>
        <div class="play-top">
          <div class="now" :class="{ bad: wrongFlash }">
            <b>{{ expectLabel }}</b>
            <span>{{ needsShift ? '按住 Shift' : '现在打' }}</span>
          </div>
          <div class="text-strip">
            <TypingText :segments="segments" :cells="cells" :index="index" />
          </div>
        </div>
      </div>

      <ResultDialog
        v-if="phase === 'over' && outcome"
        :title="endTitle"
        :score="outcome.score"
        :speed="outcome.speed"
        :speed-unit="outcome.unit"
        :accuracy="outcome.accuracy"
        :duration-ms="outcome.ms"
        @again="again"
        @back="backToSetup"
      />
    </div>
  </div>
</template>

<style scoped>
.lead,
.how,
.rule {
  margin: 0 0 10px;
  color: var(--muted);
  line-height: 1.5;
}

.how {
  color: var(--text);
  font-weight: 700;
}

.pick {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 18px;
  text-align: left;
  border: none;
  color: inherit;
}

.icon {
  font-size: 36px;
}

.pick b {
  font-size: 20px;
}

.desc,
.count {
  font-size: 13px;
  color: var(--muted);
}

.panel {
  padding: 16px 18px;
  margin-bottom: 14px;
}

.modes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.error {
  color: #dc2626;
  margin: 10px 0 0;
}

.pieces {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 8px;
}

.group-title {
  grid-column: 1 / -1;
  margin: 8px 0 0;
  font-size: 15px;
  color: #334155;
}

.piece {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border: none;
  border-radius: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  text-align: left;
  color: inherit;
}

.piece b,
.piece small {
  display: block;
}

.piece small,
.piece em {
  color: var(--muted);
  font-style: normal;
  font-size: 12px;
}

.play {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 var(--page-pad) var(--page-pad);
}

.board {
  container-type: size;
  flex: 1 1 auto;
  min-height: 168px;
  display: grid;
  place-items: center;
}

.stage {
  position: relative;
  width: min(100cqw, calc(100cqh * var(--cols) / var(--rows)));
  aspect-ratio: var(--cols) / var(--rows);
  border-radius: 18px;
  overflow: hidden;
  background: #f5f5f4;
  box-shadow: var(--shadow-md);
}

.maze,
.actors {
  position: absolute;
  inset: 0;
}

.maze {
  display: grid;
  grid-template-columns: repeat(var(--cols), 1fr);
  grid-template-rows: repeat(var(--rows), 1fr);
}

.room {
  position: relative;
  min-width: 0;
  min-height: 0;
}

.room.exit,
.room.entrance {
  background: #ecfdf5;
}

.edge {
  position: absolute;
  z-index: 2;
  background: #27272a;
}

.edge.n,
.edge.s {
  left: -1px;
  right: -1px;
  height: 9px;
}

.edge.n {
  top: 0;
}

.edge.s {
  bottom: 0;
}

.edge.w,
.edge.e {
  top: -1px;
  bottom: -1px;
  width: 9px;
}

.edge.w {
  left: 0;
}

.edge.e {
  right: 0;
}

.lines,
.trail {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow: visible;
  pointer-events: none;
}

.lines {
  z-index: 1;
}

.lines line {
  stroke: #6b7280;
  stroke-width: 0.055;
  stroke-linecap: square;
}

.trail {
  z-index: 0;
}

.trail polyline {
  fill: none;
  stroke: rgb(100 116 139 / 0.55);
  stroke-width: 4px;
  stroke-dasharray: 7 6;
  stroke-linecap: butt;
  stroke-linejoin: round;
  vector-effect: non-scaling-stroke;
}

.mark {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  font-size: 11px;
  font-weight: 800;
  color: #166534;
  line-height: 1;
  z-index: 2;
}

.mark.in {
  left: 2px;
}

.mark.out {
  right: 2px;
}

.pellet {
  position: absolute;
  width: calc(100% / var(--cols) * 0.16);
  height: calc(100% / var(--rows) * 0.16);
  left: calc((var(--c) + 0.5) / var(--cols) * 100%);
  top: calc((var(--r) + 0.5) / var(--rows) * 100%);
  transform: translate(-50%, -50%);
  border-radius: 50%;
  background: #fbbf24;
  box-shadow: 0 0 0 1px rgb(180 83 9 / 0.35);
}

.runner {
  position: absolute;
  inset: 0;
  pointer-events: none;
}

.face {
  position: absolute;
  width: calc(100% / var(--cols) * 0.62);
  height: calc(100% / var(--rows) * 0.62);
  left: calc((var(--c) + 0.19) / var(--cols) * 100%);
  top: calc((var(--r) + 0.19) / var(--rows) * 100%);
  border-radius: 50%;
  transform: rotate(var(--turn));
  background: conic-gradient(#fde047 0deg 58deg, transparent 58deg 122deg, #fde047 122deg 360deg);
  box-shadow: 0 2px 0 rgb(180 83 9 / 0.35);
}

.pupil {
  position: absolute;
  width: calc(100% / var(--cols) * 0.13);
  height: calc(100% / var(--rows) * 0.13);
  border-radius: 50%;
  background: #111827;
  z-index: 4;
}

.pupil.right {
  left: calc((var(--c) + 0.36) / var(--cols) * 100%);
  top: calc((var(--r) + 0.26) / var(--rows) * 100%);
}

.pupil.left {
  left: calc((var(--c) + 0.47) / var(--cols) * 100%);
  top: calc((var(--r) + 0.28) / var(--rows) * 100%);
}

.pupil.down {
  left: calc((var(--c) + 0.435) / var(--cols) * 100%);
  top: calc((var(--r) + 0.3) / var(--rows) * 100%);
}

.pupil.up {
  left: calc((var(--c) + 0.435) / var(--cols) * 100%);
  top: calc((var(--r) + 0.5) / var(--rows) * 100%);
}

.face.chomp {
  animation: bite linear infinite;
}

.pac.shake .face {
  animation: shake 0.18s linear;
}

.bean-body {
  position: absolute;
  width: calc(100% / var(--cols) * 0.46);
  height: calc(100% / var(--rows) * 0.46);
  left: calc((var(--c) + 0.27) / var(--cols) * 100%);
  top: calc((var(--r) + 0.27) / var(--rows) * 100%);
  border-radius: 50%;
  background: radial-gradient(circle at 35% 30%, #fffbeb 0 16%, #fde047 28%, #f59e0b 76%, #d97706 100%);
  box-shadow: 0 2px 0 rgb(146 64 14 / 0.35);
}

.bean.moving .bean-body {
  animation: hop 0.16s ease-in-out infinite;
}

.bean.bitten .bean-body {
  animation: none;
  transform: scale(0);
  transition: transform 0.12s ease-in;
}

.eyes {
  position: absolute;
  display: flex;
  gap: 12%;
  width: 62%;
  left: 22%;
  top: 34%;
}

.bean.left .eyes {
  left: 8%;
}

.bean.right .eyes {
  left: 30%;
}

.bean.up .eyes {
  top: 12%;
}

.bean.down .eyes {
  top: 48%;
}

.eyes i {
  width: 32%;
  aspect-ratio: 1;
  border-radius: 50%;
  background: #1f2937;
}

.toast {
  position: absolute;
  left: 50%;
  top: 18%;
  transform: translateX(-50%);
  margin: 0;
  padding: 8px 14px;
  border-radius: 999px;
  background: rgb(15 23 42 / 0.78);
  color: #fff;
  font-weight: 800;
  pointer-events: none;
}

.dock {
  flex: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
}

.hud {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  font-size: 13px;
  font-weight: 700;
}

.piece-name {
  max-width: 34vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.play-top {
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr);
  gap: 8px;
  min-height: 0;
}

.now {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  background: #eff6ff;
}

.now b {
  font-size: 28px;
  line-height: 1;
}

.now span {
  font-size: 12px;
  color: var(--muted);
}

.now.bad {
  background: #fee2e2;
}

.text-strip {
  max-height: 22vh;
  min-height: 64px;
  overflow: auto;
  padding: 2px 4px;
}

.text-strip :deep(.typing-text) {
  font-size: clamp(16px, 2vw, 22px);
}

@keyframes bite {
  0%,
  100% {
    background: conic-gradient(#fde047 0deg 48deg, transparent 48deg 132deg, #fde047 132deg 360deg);
  }
  50% {
    background: conic-gradient(#fde047 0deg 84deg, transparent 84deg 96deg, #fde047 96deg 360deg);
  }
}

@keyframes hop {
  0%,
  100% {
    translate: 0 8%;
  }
  50% {
    translate: 0 -14%;
  }
}

@keyframes shake {
  25% {
    translate: -3px 0;
  }
  75% {
    translate: 3px 0;
  }
}
</style>
