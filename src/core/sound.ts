import { settings } from '@/stores/settings'

let ctx: AudioContext | null = null

function audio() {
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  // iOS 需要在用户手势中 resume
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function tone(freq: number, duration: number, type: OscillatorType = 'sine', volume = 0.08, delay = 0) {
  if (!settings.sound) return
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime + delay
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  gain.gain.setValueAtTime(volume, t)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  osc.connect(gain).connect(ac.destination)
  osc.start(t)
  osc.stop(t + duration)
}

export const sound = {
  /** 首次交互时调用，解锁 iOS 音频 */
  unlock() {
    if (settings.sound) audio()
  },
  key() {
    tone(880, 0.05, 'triangle', 0.05)
  },
  error() {
    tone(180, 0.15, 'square', 0.05)
  },
  pop() {
    tone(660, 0.08, 'sine', 0.08)
    tone(990, 0.1, 'sine', 0.06, 0.05)
  },
  success() {
    ;[523, 659, 784, 1046].forEach((f, i) => tone(f, 0.18, 'triangle', 0.07, i * 0.1))
  },
  fail() {
    ;[392, 330, 262].forEach((f, i) => tone(f, 0.2, 'sawtooth', 0.04, i * 0.15))
  },
}
