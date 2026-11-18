import { persistedReactive } from './persist'

export type FingerMode = 'auto' | 'on' | 'off'

export interface Settings {
  /** 按键音效 */
  sound: boolean
  /** 显示屏幕键盘 */
  showKeyboard: boolean
  /** 手指提示：auto=入门类练习显示、文章/速度类隐藏 */
  fingerMode: FingerMode
  /** 键盘按指法分区着色 */
  fingerColors: boolean
  /** 文章练习是否允许打错后继续（可退格修改） */
  articleFreeMode: boolean
  /** 昵称 */
  nickname: string
}

export const settings = persistedReactive<Settings>('settings', {
  sound: true,
  showKeyboard: true,
  fingerMode: 'auto',
  fingerColors: true,
  articleFreeMode: false,
  nickname: '',
})
