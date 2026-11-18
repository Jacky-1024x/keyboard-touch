<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import TypingText from '@/components/TypingText.vue'
import {
  CHASE_CATEGORIES,
  listPieces,
  segmentsFor,
  type ChaseCategory,
  type ChasePiece,
} from '@/core/chase-content'
import {
  CATCH_GAP,
  THIEF_START,
  TRACK_START,
  planRace,
  targetCps,
  thiefAccel,
  type RacePlan,
} from '@/core/chase-race'
import { sound } from '@/core/sound'
import { useTypingSession } from '@/core/typing-session'
import { useKeyboardInput } from '@/core/use-keyboard-input'

type Phase = 'list' | 'setup' | 'loading' | 'play'
type RunMode = 'one' | 'multi'

/** 小偷钉在画面右侧；这一屏能看到的世界路程。距离再大，警察就会贴在左缘，小偷停下等。 */
const THIEF_SCREEN = 0.75
const POLICE_MIN_SCREEN = 0.08
const POLICE_BEHIND = 0.07
const WORLD_SPAN = 0.54
const WAIT_GAP = (THIEF_SCREEN - POLICE_MIN_SCREEN) * WORLD_SPAN
const RESUME_GAP = WAIT_GAP - 0.045
const TILE = 640

function wrap(px: number, tile: number) {
  const m = px % tile
  return m < 0 ? m + tile : m
}
const homes = [
  { color: 'pink', prop: 'tree' },
  { color: 'yellow', prop: 'bush' },
  { color: 'blue', prop: 'box' },
  { color: 'mint', prop: 'tree' },
]

const router = useRouter()
const session = useTypingSession({ mode: 'block' })
const { segments, cells, index, expected, finished, progress, load, restart, input } = session

const phase = ref<Phase>('list')
const category = ref<ChaseCategory | null>(null)
const mode = ref<RunMode>('multi')
const loadError = ref('')
const busy = ref(false)
const runPieces = ref<ChasePiece[]>([])
const runMode = ref<RunMode>('one')
const pieceIndex = ref(0)
const plan = ref<RacePlan | null>(null)
const raceOn = ref(false)
const policePos = ref(TRACK_START)
const thiefPos = ref(THIEF_START)
const shownCps = ref(0)
const elapsedSec = ref(0)
const thiefVel = ref(0)
const policePose = ref<'idle' | 'run'>('idle')
const thiefWaiting = ref(false)
const wrongFlash = ref(false)
const caughtFlash = ref(false)

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

const currentPiece = computed(() => runPieces.value[pieceIndex.value])
const headerSub = computed(() => {
  if (phase.value === 'play' && category.value) {
    return `${category.value.title} · ${pieceIndex.value + 1}/${runPieces.value.length}`
  }
  if (phase.value === 'setup' && category.value) return `${category.value.title} · 先选怎么追`
  return '选好内容，到街上把东西追回来'
})

const expectLabel = computed(() => {
  const ch = expected.value
  if (!ch) return '完成'
  if (ch === ' ') return '空格'
  return ch
})
const needsShift = computed(() => /^[A-Z]$/.test(expected.value))

/** 相机跟着小偷：他的屏幕位置不变，街景随他的世界位置往后滚。 */
const camera = computed(() => thiefPos.value - THIEF_SCREEN * WORLD_SPAN)
const sceneryX = computed(() => -wrap(camera.value * 980, TILE))
const cloudX = computed(() => -wrap(camera.value * 320, 220))
const roadShift = computed(() => -wrap(camera.value * 520, 240))
const policeScreen = computed(() => {
  const gap = Math.max(0, thiefPos.value - policePos.value)
  const raw = THIEF_SCREEN - gap / WORLD_SPAN
  return Math.min(THIEF_SCREEN - POLICE_BEHIND, Math.max(POLICE_MIN_SCREEN, raw))
})
const pieceProgress = computed(() => Math.round(progress.value * 100))

const thiefSpeedPct = computed(() => {
  if (!plan.value || !raceOn.value) return 100
  return Math.round(thiefAccel(elapsedSec.value, plan.value.tStar) * 100)
})
const statusText = computed(() => {
  if (!raceOn.value) return '打对第一个字母就出发'
  if (caughtFlash.value) return '跟上了'
  if (thiefWaiting.value) return '小偷在等你'
  const target = plan.value?.targetCps ?? 1
  if (shownCps.value >= target * 0.95) return '正在追上'
  if (shownCps.value < target * 0.45) return '小偷在拉开'
  return '咬住了'
})
let raf = 0
let lastTs = 0
let raceStartTs = 0
let wrongTimer = 0
let catchTimer = 0
let catchNoted = false
let loadToken = 0
let lastCorrectAt = 0
const paceMarks: number[] = []

function stopLoop() {
  cancelAnimationFrame(raf)
  raf = 0
}

function resetRace() {
  policePos.value = TRACK_START
  thiefPos.value = THIEF_START
  shownCps.value = 0
  elapsedSec.value = 0
  thiefVel.value = 0
  thiefWaiting.value = false
  policePose.value = 'idle'
  lastCorrectAt = 0
  paceMarks.length = 0
  raceOn.value = false
  wrongFlash.value = false
  caughtFlash.value = false
  catchNoted = false
  plan.value = null
  raceStartTs = 0
  lastTs = 0
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
  resetRace()
  phase.value = 'loading'
  const ok = await loadCurrent()
  busy.value = false
  if (phase.value !== 'loading') return
  if (!ok) {
    phase.value = 'setup'
    loadError.value = '这篇暂时没有可以打的内容'
    return
  }
  plan.value = planRace(cells.value.length, targetCps(category.value.kind, list[0].level))
  phase.value = 'play'
  raf = requestAnimationFrame(tick)
}

function startMulti() {
  void begin(pieces.value, 'multi')
}

function adaptChar(ch: string, expect: string) {
  // 英文文章保留大小写；单词和拼音与气球一样，字母不区分大小写
  if (category.value?.kind === 'en') return ch
  if (/^[a-z]$/i.test(expect) && /^[a-z]$/i.test(ch)) return ch.toLowerCase()
  return ch
}

function ensureStarted(now: number) {
  if (raceOn.value) return
  raceOn.value = true
  raceStartTs = now
  lastTs = now
}

function refreshPace(now: number) {
  const cutoff = now - 1000
  while (paceMarks.length && paceMarks[0] < cutoff) paceMarks.shift()
  shownCps.value = lastCorrectAt > 0 && now - lastCorrectAt > 400 ? 0 : paceMarks.length
}

function noteCatch() {
  const gap = thiefPos.value - policePos.value
  if (gap <= CATCH_GAP) {
    if (!catchNoted) {
      catchNoted = true
      caughtFlash.value = true
      sound.success()
      window.clearTimeout(catchTimer)
      catchTimer = window.setTimeout(() => (caughtFlash.value = false), 700)
    }
    return
  }
  if (gap > RESUME_GAP) catchNoted = false
}

function stepPolice() {
  if (!plan.value || phase.value !== 'play') return
  policePos.value += plan.value.step
  noteCatch()
}

function onChar(ch: string) {
  if (phase.value !== 'play' || !expected.value) return
  const fb = input(adaptChar(ch, expected.value))
  if (fb === 'ignored') return
  if (fb === 'correct') {
    const now = performance.now()
    lastCorrectAt = now
    paceMarks.push(now)
    refreshPace(now)
    ensureStarted(now)
    wrongFlash.value = false
    sound.key()
    stepPolice()
    return
  }
  wrongFlash.value = true
  window.clearTimeout(wrongTimer)
  wrongTimer = window.setTimeout(() => (wrongFlash.value = false), 220)
  sound.error()
}

function tick(ts: number) {
  if (phase.value !== 'play') return
  if (!raceOn.value || !plan.value) {
    lastTs = ts
    raf = requestAnimationFrame(tick)
    return
  }
  const dt = lastTs ? Math.min(0.05, (ts - lastTs) / 1000) : 0
  lastTs = ts
  refreshPace(ts)
  const sinceKey = lastCorrectAt ? (ts - lastCorrectAt) / 1000 : 99
  policePose.value = sinceKey > 0.28 ? 'idle' : 'run'
  const elapsed = (ts - raceStartTs) / 1000
  const ruleThief = plan.value.thiefBase * thiefAccel(elapsed, plan.value.tStar)
  const gap = thiefPos.value - policePos.value
  if (!thiefWaiting.value && gap >= WAIT_GAP) thiefWaiting.value = true
  else if (thiefWaiting.value && gap <= RESUME_GAP) thiefWaiting.value = false
  const tVel = thiefWaiting.value ? 0 : ruleThief
  elapsedSec.value = elapsed
  thiefVel.value = tVel
  thiefPos.value += tVel * dt
  noteCatch()
  raf = requestAnimationFrame(tick)
}

function backToSetup() {
  stopLoop()
  loadToken += 1
  phase.value = category.value ? 'setup' : 'list'
}

function onEscape() {
  if (phase.value === 'play' || phase.value === 'loading') {
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
  if (runMode.value === 'multi' && runPieces.value.length > 1) {
    pieceIndex.value = (pieceIndex.value + 1) % runPieces.value.length
    const ok = await loadCurrent()
    if (!ok && phase.value === 'play') restart()
    return
  }
  restart()
})

useKeyboardInput({
  onChar,
  onEscape,
})

onBeforeUnmount(() => {
  stopLoop()
  window.clearTimeout(wrongTimer)
  window.clearTimeout(catchTimer)
})
</script>

<template>
  <div class="page">
    <AppHeader title="👮 警察抓小偷" :subtitle="headerSub" back="/games" />

    <div v-if="phase === 'list'" class="page-body">
      <p class="lead">先选要打的内容。英文打原文，中文打拼音。追上小偷，把东西要回来。</p>
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
          小偷按这一篇的长短和难度匀速跑，并在预计追上的时间里慢慢加快到开局的 1.06
          倍，然后就保持。每打对一个字母，警察立刻往前一小截；手一停，人马上停，不会往前滑。打错不往前。小偷跑得很快，要一直打得很快才有机会追上。
        </p>
        <p class="rule">小偷和警察都在跑步。手一停，跑步马上停。</p>
        <div class="modes">
          <button type="button" class="btn" :class="{ on: mode === 'multi' }" @click="mode = 'multi'">连续多篇</button>
          <button type="button" class="btn" :class="{ on: mode === 'one' }" @click="mode = 'one'">只打一篇</button>
          <button type="button" class="btn" @click="phase = 'list'">返回类别</button>
        </div>
        <p v-if="loadError" class="error">{{ loadError }}</p>
      </div>

      <div v-if="mode === 'multi'" class="card panel">
        <p>
          从第一篇按顺序接到最后，共 {{ pieces.length }} {{ category?.unit }}。打完一篇马上下一篇，这一类打完再从第一篇接着追。只打一篇时，这一篇打完会从头再来。追击不会自己结束，按返回或 Esc 离开。
        </p>
        <button type="button" class="btn primary" :disabled="!pieces.length" @click="startMulti">开始追击</button>
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
      <div class="card panel">正在打开这一篇…</div>
    </div>

    <div v-else class="play">
      <div class="street">
        <div class="sun" />
        <div class="clouds" :style="{ transform: `translate3d(${cloudX}px,0,0)` }">
          <i v-for="n in 8" :key="n" />
        </div>
        <div class="loop" :style="{ transform: `translate3d(${sceneryX}px,0,0)` }">
          <div v-for="n in 4" :key="n" class="tile">
            <div v-for="home in homes" :key="`${n}-${home.color}`" class="spot">
              <div class="house" :class="home.color">
                <div class="roof" />
                <div class="wall">
                  <div class="window" />
                  <div class="door" />
                </div>
              </div>
              <div class="prop" :class="home.prop" />
            </div>
          </div>
        </div>
        <div class="road">
          <div class="dashes" :style="{ backgroundPositionX: `${roadShift}px` }" />
        </div>

        <div class="actor" :style="{ left: `${THIEF_SCREEN * 100}%` }">
          <div class="sprite">
            <div class="person thief" :class="{ moving: raceOn && phase === 'play' && !thiefWaiting }">
              <div class="sack" />
              <div class="head" />
              <div class="torso" />
              <div class="legs"><i /><i /></div>
            </div>
            <em>小偷</em>
          </div>
        </div>
        <div class="actor" :style="{ left: `${policeScreen * 100}%` }">
          <div class="sprite">
            <div class="person police" :class="{ moving: policePose === 'run' }">
              <div class="cap" />
              <div class="head" />
              <div class="torso" />
              <div class="legs"><i /><i /></div>
            </div>
            <em>警察</em>
          </div>
        </div>
      </div>

      <div class="dock">
        <div class="play-top">
          <div class="now" :class="{ bad: wrongFlash }">
            <b>{{ expectLabel }}</b>
            <span>{{ needsShift ? '按住 Shift' : '现在打' }}</span>
          </div>
          <div class="text-strip">
            <TypingText :segments="segments" :cells="cells" :index="index" />
          </div>
        </div>
        <div class="hud">
          <div class="meter" aria-label="这一篇的进度">
            <i class="fill" :style="{ width: `${pieceProgress}%` }" />
          </div>
          <div class="stats">
            <b class="piece-name">{{ currentPiece?.title }}</b>
            <span>{{ statusText }}</span>
            <span>本篇 {{ pieceProgress }}%</span>
            <span>你 {{ shownCps.toFixed(1) }} 下/秒</span>
            <span v-if="plan">目标 {{ plan.targetCps.toFixed(1) }}</span>
            <span>小偷 {{ thiefSpeedPct }}%</span>
          </div>
        </div>
      </div>
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
  overflow: hidden;
}

.hud,
.stats {
  display: flex;
  align-items: center;
  gap: 10px;
  min-width: 0;
  flex-shrink: 0;
}

.hud {
  flex-wrap: wrap;
  width: 100%;
}

.stats {
  flex: 1 1 100%;
  max-width: 100%;
}

.meter {
  position: relative;
  flex: 1 1 180px;
  height: 14px;
  border-radius: 999px;
  background: #e2e8f0;
}

.meter .fill {
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  border-radius: inherit;
  background: #4f8cff;
}

.stats {
  flex-wrap: wrap;
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
  flex: 1 1 auto;
  min-height: 72px;
}

.dock {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  border-radius: 16px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  overflow: hidden;
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
  min-height: 64px;
  overflow: auto;
  padding: 2px 4px;
}

.text-strip :deep(.typing-text) {
  font-size: clamp(16px, 2vw, 22px);
}

.street {
  position: relative;
  flex: 0 0 auto;
  height: 180px;
  min-height: 116px;
  max-height: 180px;
  overflow: hidden;
  border-radius: 24px;
  background: linear-gradient(#7dd3fc 0%, #e0f2fe 58%, #86efac 58%, #4ade80 78%, #94a3b8 78%);
}

.sun {
  position: absolute;
  top: 12px;
  right: 28px;
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: #fde047;
  box-shadow: 0 0 0 8px rgb(253 224 71 / 0.35);
}

.clouds {
  position: absolute;
  top: 18px;
  left: 0;
  display: flex;
  gap: 70px;
  white-space: nowrap;
}

.clouds i {
  display: inline-block;
  width: 54px;
  height: 16px;
  border-radius: 16px;
  background: #fff;
  opacity: 0.9;
}

.loop {
  position: absolute;
  left: 0;
  bottom: 16%;
  display: flex;
  align-items: flex-end;
  will-change: transform;
}

.tile {
  width: 640px;
  flex: none;
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
}

.spot {
  display: flex;
  align-items: flex-end;
  gap: 6px;
}

.house {
  width: 58px;
}

.roof {
  height: 18px;
  background: #fb7185;
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
}

.house.yellow .roof {
  background: #f59e0b;
}

.house.blue .roof {
  background: #3b82f6;
}

.house.mint .roof {
  background: #14b8a6;
}

.wall {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  height: 48px;
  padding-top: 4px;
  background: #fff;
  border: 2px solid #e2e8f0;
  border-bottom: none;
}

.house.pink .wall {
  background: #fbcfe8;
}

.house.yellow .wall {
  background: #fef3c7;
}

.house.blue .wall {
  background: #dbeafe;
}

.house.mint .wall {
  background: #ccfbf1;
}

.window {
  width: 18px;
  height: 14px;
  border: 2px solid #64748b;
  border-radius: 3px;
  background:
    linear-gradient(#64748b, #64748b) center / 2px 100% no-repeat,
    linear-gradient(#64748b, #64748b) center / 100% 2px no-repeat,
    #fff;
}

.door {
  width: 14px;
  height: 18px;
  margin-top: auto;
  border-radius: 6px 6px 0 0;
  background: #b45309;
}

.prop.tree {
  width: 28px;
  height: 36px;
  background:
    radial-gradient(circle at 50% 35%, #4ade80 0 16px, transparent 17px),
    linear-gradient(#a16207, #a16207) center bottom / 6px 14px no-repeat;
}

.prop.bush {
  width: 34px;
  height: 18px;
  border-radius: 16px 16px 6px 6px;
  background: #16a34a;
}

.prop.bush.big {
  width: 48px;
  height: 26px;
}

.prop.box {
  width: 26px;
  height: 20px;
  border: 2px solid #92400e;
  background:
    linear-gradient(#92400e, #92400e) center / 100% 2px no-repeat,
    #f59e0b;
}

.road {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 16%;
  background: #cbd5e1;
}

.dashes {
  position: absolute;
  left: 0;
  right: 0;
  top: 42%;
  height: 4px;
  background: repeating-linear-gradient(90deg, #fff 0 16px, transparent 16px 32px);
}

.actor {
  position: absolute;
  bottom: 14%;
  z-index: 3;
  width: 0;
  height: 0;
}

.sprite {
  position: absolute;
  left: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  transform: translateX(-50%) scale(1.45);
  transform-origin: bottom center;
}

.sprite em {
  margin-top: 2px;
  padding: 0 6px;
  border-radius: 999px;
  background: #fff;
  font-style: normal;
  font-size: 11px;
  font-weight: 800;
}

.person {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 36px;
}

.person.moving {
  animation: bob 0.32s ease-in-out infinite;
}

.head {
  position: relative;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #fdba74;
}

.head::before,
.head::after {
  content: '';
  position: absolute;
  top: 6px;
  width: 3px;
  height: 3px;
  border-radius: 50%;
  background: #1e293b;
}

.head::before {
  left: 3px;
}

.head::after {
  right: 3px;
}

.cap {
  width: 18px;
  height: 7px;
  margin-bottom: -4px;
  border-radius: 6px 6px 0 0;
  background: #1d4ed8;
  box-shadow: 8px 4px 0 -2px #1d4ed8;
  z-index: 1;
}

.torso {
  width: 18px;
  height: 16px;
  margin-top: 1px;
  border-radius: 6px 6px 4px 4px;
  background: #2563eb;
}

.thief .torso {
  background: #fb923c;
}

.sack {
  position: absolute;
  left: -8px;
  top: 16px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #facc15;
  border: 2px solid #ca8a04;
}

.legs {
  display: flex;
  gap: 4px;
  height: 12px;
}

.legs i {
  width: 4px;
  height: 12px;
  border-radius: 2px;
  background: #334155;
  transform-origin: top center;
}

.person.moving .legs i {
  animation: step 0.22s ease-in-out infinite alternate;
}

.person.moving .legs i:last-child {
  animation-delay: -0.11s;
}

@keyframes bob {
  50% {
    transform: translateY(-5px);
  }
}

@keyframes step {
  from {
    transform: rotate(22deg);
  }
  to {
    transform: rotate(-18deg);
  }
}

@media (max-height: 700px) {
  .now b {
    font-size: 22px;
  }

  .dock {
    gap: 4px;
    padding: 6px;
  }

  .text-strip {
    min-height: 56px;
  }

  .street {
    height: 124px;
    min-height: 116px;
    max-height: 124px;
  }
}

@media (max-width: 720px) {
  .play-top {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .street {
    height: 150px;
    min-height: 116px;
    max-height: 150px;
  }

  .stats {
    font-size: 12px;
    gap: 6px;
  }
}

@media (max-height: 700px) and (max-width: 720px) {
  .street {
    height: 116px;
    min-height: 116px;
    max-height: 116px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .person.moving,
  .person.moving .legs i {
    animation: none;
  }
}
</style>
