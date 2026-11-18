/**
 * 事先生成的迷宫。路以房间为单位：入口在最左一列，出口在最右一列。
 * 外圈是实心墙，房间之间只留细线，所以同样的画面里能放下更长的路。
 * 种子固定，第 n 关每次都是同一张图。
 */

export interface MazeCell {
  r: number
  c: number
}

export interface MazeLevel {
  id: number
  rows: number
  cols: number
  /** 房间 (r,c) 右侧是否打通，列数是 cols-1 */
  right: boolean[][]
  /** 房间 (r,c) 下侧是否打通，行数是 rows-1 */
  down: boolean[][]
  /** 从入口房间到出口房间 */
  path: MazeCell[]
  /** 沿路相隔的房间数，到达出口前不变 */
  gap: number
}

export const MAZE_COUNT = 100

/** 房间数。墙不占格子，只画在房间边上，所以可以排得更密。 */
const ROOMS_R = 10
const ROOMS_C = 25
const MIN_PATH = 46

const DIRS: readonly [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** 到达出口前，吃豆人与豆沿路始终相隔这么多间。2 间就是停在前面第二颗豆上。 */
export const MAZE_GAP = 2

function carve(seed: number) {
  const rng = mulberry32(seed)
  const right = Array.from({ length: ROOMS_R }, () => Array<boolean>(ROOMS_C - 1).fill(false))
  const down = Array.from({ length: ROOMS_R - 1 }, () => Array<boolean>(ROOMS_C).fill(false))
  const seen = Array.from({ length: ROOMS_R }, () => Array<boolean>(ROOMS_C).fill(false))
  const stack: [number, number][] = []
  const sr = Math.floor(rng() * ROOMS_R)
  const sc = Math.floor(rng() * ROOMS_C)
  seen[sr][sc] = true
  stack.push([sr, sc])

  while (stack.length) {
    const [r, c] = stack[stack.length - 1]
    const next = DIRS.map(([dr, dc]) => [r + dr, c + dc] as [number, number]).filter(
      ([nr, nc]) => nr >= 0 && nc >= 0 && nr < ROOMS_R && nc < ROOMS_C && !seen[nr][nc],
    )
    if (!next.length) {
      stack.pop()
      continue
    }
    const [nr, nc] = next[Math.floor(rng() * next.length)]
    seen[nr][nc] = true
    if (nc === c + 1) right[r][c] = true
    else if (nc === c - 1) right[r][nc] = true
    else if (nr === r + 1) down[r][c] = true
    else down[nr][c] = true
    stack.push([nr, nc])
  }

  const entrance: MazeCell = { r: Math.floor(rng() * ROOMS_R), c: 0 }
  const exit: MazeCell = { r: Math.floor(rng() * ROOMS_R), c: ROOMS_C - 1 }
  const path = shortest(right, down, entrance, exit)
  if (!path || path.length < MIN_PATH) return null
  const usedRows = new Set(path.map((cell) => cell.r))
  if (usedRows.size < 7) return null
  if (path[0].c !== 0 || path[path.length - 1].c !== ROOMS_C - 1) return null
  return { right, down, path }
}

function shortest(right: boolean[][], down: boolean[][], start: MazeCell, goal: MazeCell) {
  const key = (r: number, c: number) => r * ROOMS_C + c
  const prev = new Int32Array(ROOMS_R * ROOMS_C).fill(-2)
  const queue: MazeCell[] = [start]
  prev[key(start.r, start.c)] = -1
  let head = 0
  while (head < queue.length) {
    const cur = queue[head++]
    if (cur.r === goal.r && cur.c === goal.c) {
      const path: MazeCell[] = []
      let k = key(cur.r, cur.c)
      while (k !== -1) {
        path.push({ r: Math.floor(k / ROOMS_C), c: k % ROOMS_C })
        k = prev[k]
      }
      path.reverse()
      return path
    }
    const next: MazeCell[] = []
    if (cur.c + 1 < ROOMS_C && right[cur.r][cur.c]) next.push({ r: cur.r, c: cur.c + 1 })
    if (cur.c > 0 && right[cur.r][cur.c - 1]) next.push({ r: cur.r, c: cur.c - 1 })
    if (cur.r + 1 < ROOMS_R && down[cur.r][cur.c]) next.push({ r: cur.r + 1, c: cur.c })
    if (cur.r > 0 && down[cur.r - 1][cur.c]) next.push({ r: cur.r - 1, c: cur.c })
    for (const cell of next) {
      const k = key(cell.r, cell.c)
      if (prev[k] !== -2) continue
      prev[k] = key(cur.r, cur.c)
      queue.push(cell)
    }
  }
  return null
}

function buildMazes(count: number): MazeLevel[] {
  const mazes: MazeLevel[] = []
  let salt = 1
  while (mazes.length < count && salt < count * 80) {
    const carved = carve(salt * 9973 + 17)
    salt += 1
    if (!carved) continue
    mazes.push({
      id: mazes.length + 1,
      rows: ROOMS_R,
      cols: ROOMS_C,
      right: carved.right,
      down: carved.down,
      path: carved.path,
      gap: MAZE_GAP,
    })
  }
  if (mazes.length < count) {
    throw new Error(`只生成了 ${mazes.length} 张迷宫`)
  }
  return mazes
}

export const MAZES: readonly MazeLevel[] = buildMazes(MAZE_COUNT)

/** 浮点下标落到路上的房间坐标，方便在两间之间滑动。 */
export function pointOnPath(path: readonly MazeCell[], index: number) {
  const last = path.length - 1
  const clamped = Math.max(0, Math.min(last, index))
  const i = Math.floor(clamped)
  const frac = clamped - i
  const a = path[i]
  const b = path[Math.min(last, i + 1)]
  return {
    r: a.r + (b.r - a.r) * frac,
    c: a.c + (b.c - a.c) * frac,
  }
}

export type MazeFacing = 'right' | 'left' | 'up' | 'down'

export function facingOnPath(path: readonly MazeCell[], index: number): MazeFacing {
  const last = path.length - 1
  const i = Math.max(0, Math.min(last - 1, Math.floor(index + 1e-4)))
  const a = path[i]
  const b = path[Math.min(last, i + 1)]
  if (b.c > a.c) return 'right'
  if (b.c < a.c) return 'left'
  if (b.r > a.r) return 'down'
  return 'up'
}

export const FACING_DEG: Record<MazeFacing, number> = {
  right: 0,
  down: 90,
  left: 180,
  up: -90,
}
