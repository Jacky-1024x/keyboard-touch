/**
 * 警察抓小偷的路程规则。路程是 0（起点）到 1（树丛藏身处）。
 *
 * 小偷不看你打得快慢。开局速度是「最初基线 ×1.8 ×2.5」再乘 0.9，
 * 仍在预计时间里线性加快到开局的 1.06 倍，然后保持。
 * 警察没有速度、也没有惯性：每打对 1 个字符，立刻向前固定的一段。
 * 这一段是「上一版步长 ×1/4 ×1.1 ×1.2」再乘 1.2。路程没有尽头，1 只是用来量这段距离的旧街长。
 */

export type ChaseInputKind = 'words' | 'en' | 'zh'

export const TRACK_START = 0.08
export const THIEF_START = 0.42
/** 上一版用来算出步长的参考交汇点。步长随后再乘 STEP_SCALE，不再对准这里。 */
const MEET = 0.82
/** 上一版相对最初基线的倍数。最初基线是在 tStar 内跑完 0.76−0.42。 */
const PREVIOUS_THIEF_BOOST = 1.8
/** 在「上一版 ×2.5」的当前开局速度上再乘 0.9。 */
const THIEF_BOOST = PREVIOUS_THIEF_BOOST * 2.5 * 0.9
/** 在「上一版 ×1/4 ×1.1 ×1.2」的当前每字步长上再乘 1.2。 */
const STEP_SCALE = 0.25 * 1.1 * 1.2 * 1.2
const OLD_THIEF_SPAN = 0.76 - THIEF_START
export const ACCEL_MAX = 0.06
export const CATCH_GAP = 0.012

export interface RacePlan {
  /** 用来铺开小偷轻微加速的秒数 */
  tStar: number
  /** 目标正确按键速度（下/秒），只用来对齐步长和界面提示 */
  targetCps: number
  /** 每打对 1 个字符，警察前进的路程 */
  step: number
  /** 小偷开局每秒前进的路程（之后最多再快 6%） */
  thiefBase: number
}

/** 正确按键的目标速度。英文大约等于每秒目标 × 12 词/分。 */
export function targetCps(kind: ChaseInputKind, level: 1 | 2 | 3) {
  if (kind === 'words') return 0.7
  const table = [0.8, 1.05, 1.3] as const
  return table[level - 1] ?? table[0]
}

export function thiefAccel(elapsedSec: number, tStar: number) {
  const ramp = Math.max(tStar, 0.1)
  return 1 + ACCEL_MAX * Math.min(1, Math.max(0, elapsedSec) / ramp)
}

export function planRace(keystrokes: number, cps: number): RacePlan {
  const target = Math.max(0.25, cps)
  const textTime = Math.max(1, keystrokes) / target
  let tStar = textTime * 0.7
  if (tStar < 8) tStar = Math.min(8, textTime * 0.8)
  tStar = Math.min(72, tStar)
  const previousBase = (PREVIOUS_THIEF_BOOST * OLD_THIEF_SPAN) / tStar
  const tMeet = (MEET - THIEF_START) / previousBase
  const step = STEP_SCALE * ((MEET - TRACK_START) / (target * tMeet))
  const thiefBase = previousBase * (THIEF_BOOST / PREVIOUS_THIEF_BOOST)
  return { tStar, targetCps: target, step, thiefBase }
}
