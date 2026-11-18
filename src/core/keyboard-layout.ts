/**
 * 标准美式 QWERTY 键盘布局 + 指法映射。
 * 键宽单位 u：1u = 一个字母键宽度，每行总宽 15u。
 */

/** 手指：l/r = 左/右手，p 小指 / r 无名指 / m 中指 / i 食指，th 拇指 */
export type Finger = 'lp' | 'lr' | 'lm' | 'li' | 'ri' | 'rm' | 'rr' | 'rp' | 'th'

export interface KeyDef {
  /** 与 KeyboardEvent.code 一致 */
  code: string
  /** 主字符（字母为小写），功能键为显示文字 */
  label: string
  /** 按住 Shift 输出的字符 */
  shiftLabel?: string
  /** 键宽，单位 u，默认 1 */
  width?: number
  finger: Finger
  /** F、J 上的定位凸点 */
  bump?: boolean
  /** 基准键（ASDF JKL;） */
  home?: boolean
  /** 功能键（不直接输出字符） */
  fn?: boolean
}

export const FINGER_NAMES: Record<Finger, string> = {
  lp: '左手小指',
  lr: '左手无名指',
  lm: '左手中指',
  li: '左手食指',
  ri: '右手食指',
  rm: '右手中指',
  rr: '右手无名指',
  rp: '右手小指',
  th: '大拇指',
}

/** 每个手指对应的颜色（键盘分区色 + 手指高亮色保持一致） */
export const FINGER_COLORS: Record<Finger, string> = {
  lp: '#f9a8d4',
  lr: '#fdba74',
  lm: '#86efac',
  li: '#93c5fd',
  ri: '#c4b5fd',
  rm: '#86efac',
  rr: '#fdba74',
  rp: '#f9a8d4',
  th: '#cbd5e1',
}

const k = (code: string, label: string, finger: Finger, extra: Partial<KeyDef> = {}): KeyDef => ({
  code,
  label,
  finger,
  ...extra,
})

const letter = (ch: string, finger: Finger, extra: Partial<KeyDef> = {}) =>
  k(`Key${ch.toUpperCase()}`, ch, finger, { shiftLabel: ch.toUpperCase(), ...extra })

export const KEYBOARD_ROWS: KeyDef[][] = [
  [
    k('Backquote', '`', 'lp', { shiftLabel: '~' }),
    k('Digit1', '1', 'lp', { shiftLabel: '!' }),
    k('Digit2', '2', 'lr', { shiftLabel: '@' }),
    k('Digit3', '3', 'lm', { shiftLabel: '#' }),
    k('Digit4', '4', 'li', { shiftLabel: '$' }),
    k('Digit5', '5', 'li', { shiftLabel: '%' }),
    k('Digit6', '6', 'ri', { shiftLabel: '^' }),
    k('Digit7', '7', 'ri', { shiftLabel: '&' }),
    k('Digit8', '8', 'rm', { shiftLabel: '*' }),
    k('Digit9', '9', 'rr', { shiftLabel: '(' }),
    k('Digit0', '0', 'rp', { shiftLabel: ')' }),
    k('Minus', '-', 'rp', { shiftLabel: '_' }),
    k('Equal', '=', 'rp', { shiftLabel: '+' }),
    k('Backspace', '⌫', 'rp', { width: 2, fn: true }),
  ],
  [
    k('Tab', 'Tab', 'lp', { width: 1.5, fn: true }),
    letter('q', 'lp'),
    letter('w', 'lr'),
    letter('e', 'lm'),
    letter('r', 'li'),
    letter('t', 'li'),
    letter('y', 'ri'),
    letter('u', 'ri'),
    letter('i', 'rm'),
    letter('o', 'rr'),
    letter('p', 'rp'),
    k('BracketLeft', '[', 'rp', { shiftLabel: '{' }),
    k('BracketRight', ']', 'rp', { shiftLabel: '}' }),
    k('Backslash', '\\', 'rp', { shiftLabel: '|', width: 1.5 }),
  ],
  [
    k('CapsLock', 'Caps', 'lp', { width: 1.75, fn: true }),
    letter('a', 'lp', { home: true }),
    letter('s', 'lr', { home: true }),
    letter('d', 'lm', { home: true }),
    letter('f', 'li', { home: true, bump: true }),
    letter('g', 'li'),
    letter('h', 'ri'),
    letter('j', 'ri', { home: true, bump: true }),
    letter('k', 'rm', { home: true }),
    letter('l', 'rr', { home: true }),
    k('Semicolon', ';', 'rp', { shiftLabel: ':', home: true }),
    k('Quote', "'", 'rp', { shiftLabel: '"' }),
    k('Enter', 'Enter', 'rp', { width: 2.25, fn: true }),
  ],
  [
    k('ShiftLeft', 'Shift', 'lp', { width: 2.25, fn: true }),
    letter('z', 'lp'),
    letter('x', 'lr'),
    letter('c', 'lm'),
    letter('v', 'li'),
    letter('b', 'li'),
    letter('n', 'ri'),
    letter('m', 'ri'),
    k('Comma', ',', 'rm', { shiftLabel: '<' }),
    k('Period', '.', 'rr', { shiftLabel: '>' }),
    k('Slash', '/', 'rp', { shiftLabel: '?' }),
    k('ShiftRight', 'Shift', 'rp', { width: 2.75, fn: true }),
  ],
  [k('Space', '', 'th', { width: 7 })],
]

export interface CharKey {
  key: KeyDef
  shift: boolean
}

const charMap = new Map<string, CharKey>()
for (const row of KEYBOARD_ROWS) {
  for (const key of row) {
    if (key.fn) continue
    if (key.code === 'Space') {
      charMap.set(' ', { key, shift: false })
      continue
    }
    charMap.set(key.label, { key, shift: false })
    if (key.shiftLabel) charMap.set(key.shiftLabel, { key, shift: true })
  }
}

/** 根据要输入的字符查找对应按键及是否需要 Shift */
export function findKeyByChar(ch: string): CharKey | undefined {
  return charMap.get(ch)
}

export function isLeftHand(finger: Finger) {
  return finger.startsWith('l')
}

/** 需要 Shift 时应按下的 Shift 键：与字符键相反的那只手 */
export function shiftCodeFor(finger: Finger): 'ShiftLeft' | 'ShiftRight' {
  return isLeftHand(finger) ? 'ShiftRight' : 'ShiftLeft'
}

/** 输入某字符时需要用到的所有手指 */
export function fingersForChar(ch: string): Finger[] {
  const hit = findKeyByChar(ch)
  if (!hit) return []
  const list: Finger[] = [hit.key.finger]
  if (hit.shift) list.push(isLeftHand(hit.key.finger) ? 'rp' : 'lp')
  return list
}
