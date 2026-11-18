import { pinyin } from 'pinyin-pro'
import type { Segment } from './typing-session'

const HANZI = /[\u3400-\u9fff]/
const ASCII_WORD = /[A-Za-z0-9]/

export function hasHanzi(text: string) {
  return HANZI.test(text)
}

/**
 * 中文文本 → 拼音练习 segments。
 * - 每个汉字一个 segment：label=汉字，text=无声调拼音（ü 用 v 表示），sub=带声调拼音
 * - 连续的英文字母/数字合并成一个需要输入的 segment
 * - 标点、空白、换行只展示不输入
 */
export function textToPinyinSegments(text: string): Segment[] {
  const chars = Array.from(text)
  const plain = pinyin(text, { type: 'array', toneType: 'none', v: true, nonZh: 'consecutive' })
  const toned = pinyin(text, { type: 'array', toneType: 'symbol', nonZh: 'consecutive' })

  // pinyin-pro 在 nonZh: 'consecutive' 下会把连续非汉字合并成一个元素，
  // 这里按原文逐字符重新对齐，保证每个汉字一一对应。
  const segments: Segment[] = []
  let p = 0
  let i = 0
  while (i < chars.length) {
    const ch = chars[i]
    if (HANZI.test(ch)) {
      segments.push({ label: ch, text: plain[p] ?? '', sub: toned[p] ?? '' })
      p++
      i++
      continue
    }
    // 非汉字连续段
    let run = ''
    while (i < chars.length && !HANZI.test(chars[i])) run += chars[i++]
    p++
    for (const piece of splitNonZh(run)) segments.push(piece)
  }
  return segments
}

function splitNonZh(run: string): Segment[] {
  const out: Segment[] = []
  let word = ''
  const flush = () => {
    if (word) out.push({ text: word.toLowerCase(), label: word })
    word = ''
  }
  for (const ch of run) {
    if (ASCII_WORD.test(ch)) {
      word += ch
    } else {
      flush()
      if (ch === '\n') out.push({ text: '', label: '\n', skip: true })
      else if (ch.trim()) out.push({ text: '', label: ch, skip: true })
    }
  }
  flush()
  return out
}

/** 汉字词语 → 无声调拼音（连写），用于游戏等场景 */
export function wordToPinyin(word: string) {
  return pinyin(word, { toneType: 'none', v: true, separator: '' }).replace(/\s+/g, '')
}
