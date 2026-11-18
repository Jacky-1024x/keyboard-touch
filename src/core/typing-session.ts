import { computed, onBeforeUnmount, reactive, ref, shallowRef } from 'vue'

/**
 * 练习内容的基本单位。
 * - 英文：一个单词 / 一组字母为一个 segment
 * - 拼音：一个汉字为一个 segment（label=汉字，text=无声调拼音）
 */
export interface Segment {
  /** 需要键入的内容 */
  text: string
  /** 显示在上方的提示（汉字 / 中文释义） */
  label?: string
  /** 次级提示（带声调拼音等） */
  sub?: string
  /** 仅展示、无需输入（标点、换行） */
  skip?: boolean
}

export type CellState = 'pending' | 'correct' | 'wrong' | 'fixed'

export interface Cell {
  ch: string
  seg: number
  /** 是否为 segment 之间自动插入的分隔符 */
  sep: boolean
  state: CellState
}

export interface SessionOptions {
  /** segment 之间的分隔符，默认空格 */
  separator?: string
  /**
   * block：打错不前进，必须打对（适合低龄 / 入门）
   * free：打错也前进，可用退格修改（适合文章练习）
   */
  mode?: 'block' | 'free'
  /** 按汉字计速（字/分），否则按英文 WPM（词/分） */
  hanziSpeed?: boolean
}

export interface SessionResult {
  durationMs: number
  /** 英文：WPM（5 字符 = 1 词）；中文拼音：字/分钟 */
  speed: number
  speedUnit: string
  /** 0~100 */
  accuracy: number
  keystrokes: number
  errors: number
}

export type InputFeedback = 'correct' | 'wrong' | 'ignored'

export function buildCells(segments: Segment[], separator = ' '): Cell[] {
  const cells: Cell[] = []
  let lastTyped = -1
  segments.forEach((seg, i) => {
    if (seg.skip || !seg.text) return
    if (lastTyped >= 0 && separator) {
      for (const ch of separator) cells.push({ ch, seg: lastTyped, sep: true, state: 'pending' })
    }
    for (const ch of seg.text) cells.push({ ch, seg: i, sep: false, state: 'pending' })
    lastTyped = i
  })
  return cells
}

export function useTypingSession(options: SessionOptions = {}) {
  const mode = options.mode ?? 'block'
  const segments = shallowRef<Segment[]>([])
  const cells = ref<Cell[]>([])
  const index = ref(0)
  const stats = reactive({ keystrokes: 0, errors: 0, startAt: 0, endAt: 0 })
  const now = ref(Date.now())
  let timer: number | undefined

  const started = computed(() => stats.startAt > 0)
  const finished = computed(() => stats.endAt > 0)
  const expected = computed(() => cells.value[index.value]?.ch ?? '')
  const currentSeg = computed(() => cells.value[index.value]?.seg ?? -1)
  const progress = computed(() => (cells.value.length ? index.value / cells.value.length : 0))
  const elapsedMs = computed(() => {
    if (!started.value) return 0
    return (finished.value ? stats.endAt : now.value) - stats.startAt
  })

  const isHanzi = !!options.hanziSpeed

  const speed = computed(() => {
    const minutes = elapsedMs.value / 60000
    if (minutes <= 0) return 0
    if (isHanzi) {
      const done = new Set(cells.value.slice(0, index.value).filter((c) => !c.sep).map((c) => c.seg))
      // 当前 segment 未打完不计入
      if (index.value < cells.value.length) done.delete(currentSeg.value)
      return Math.round(done.size / minutes)
    }
    const correctChars = cells.value.slice(0, index.value).filter((c) => c.state !== 'wrong').length
    return Math.round(correctChars / 5 / minutes)
  })
  const speedUnit = computed(() => (isHanzi ? '字/分' : '词/分'))
  const accuracy = computed(() => {
    if (!stats.keystrokes) return 100
    return Math.max(0, Math.round(((stats.keystrokes - stats.errors) / stats.keystrokes) * 100))
  })

  function load(list: Segment[]) {
    stopTimer()
    segments.value = list
    cells.value = buildCells(list, options.separator ?? ' ')
    index.value = 0
    stats.keystrokes = 0
    stats.errors = 0
    stats.startAt = 0
    stats.endAt = 0
  }

  function restart() {
    load(segments.value)
  }

  function startTimer() {
    stopTimer()
    timer = window.setInterval(() => (now.value = Date.now()), 250)
  }
  function stopTimer() {
    if (timer) window.clearInterval(timer)
    timer = undefined
  }

  function finish() {
    stats.endAt = Date.now()
    now.value = stats.endAt
    stopTimer()
  }

  /** 处理一个输入字符 */
  function input(ch: string): InputFeedback {
    if (finished.value || !cells.value.length) return 'ignored'
    if (!started.value) {
      stats.startAt = Date.now()
      now.value = stats.startAt
      startTimer()
    }
    const cell = cells.value[index.value]
    stats.keystrokes++
    const ok = ch === cell.ch
    if (ok) {
      cell.state = cell.state === 'wrong' ? 'fixed' : 'correct'
      index.value++
    } else {
      stats.errors++
      cell.state = 'wrong'
      if (mode === 'free') index.value++
    }
    if (index.value >= cells.value.length) finish()
    return ok ? 'correct' : 'wrong'
  }

  /** 退格（仅 free 模式生效） */
  function backspace() {
    if (mode !== 'free' || finished.value || index.value === 0) return
    index.value--
    cells.value[index.value].state = 'pending'
  }

  function result(): SessionResult {
    return {
      durationMs: elapsedMs.value,
      speed: speed.value,
      speedUnit: speedUnit.value,
      accuracy: accuracy.value,
      keystrokes: stats.keystrokes,
      errors: stats.errors,
    }
  }

  onBeforeUnmount(stopTimer)

  return {
    segments,
    cells,
    index,
    expected,
    currentSeg,
    progress,
    elapsedMs,
    speed,
    speedUnit,
    accuracy,
    started,
    finished,
    load,
    restart,
    input,
    backspace,
    result,
  }
}

export type TypingSession = ReturnType<typeof useTypingSession>
