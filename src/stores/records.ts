import { persistedReactive } from './persist'

export interface PracticeRecord {
  kind: string
  title: string
  speed: number
  speedUnit: string
  accuracy: number
  durationMs: number
  /** 游戏得分 */
  score?: number
  at: number
}

const MAX = 200

export const records = persistedReactive<{ list: PracticeRecord[] }>('records', { list: [] })

export function addRecord(r: Omit<PracticeRecord, 'at'>) {
  records.list.unshift({ ...r, at: Date.now() })
  if (records.list.length > MAX) records.list.length = MAX
}

/** 根据速度与正确率给出 1~3 颗星 */
export function starsOf(accuracy: number, speed: number, unit: string) {
  const fast = unit === '字/分' ? speed >= 30 : speed >= 15
  if (accuracy >= 95 && fast) return 3
  if (accuracy >= 85) return 2
  return 1
}
