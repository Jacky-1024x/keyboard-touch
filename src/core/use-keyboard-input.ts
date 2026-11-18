import { onBeforeUnmount, onMounted, ref } from 'vue'

export interface KeyboardInputHandlers {
  onChar?: (ch: string, e: KeyboardEvent) => void
  onBackspace?: (e: KeyboardEvent) => void
  onEnter?: (e: KeyboardEvent) => void
  onEscape?: (e: KeyboardEvent) => void
}

function isEditable(target: EventTarget | null) {
  const el = target as HTMLElement | null
  if (!el) return false
  return el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName)
}

/**
 * 全局监听实体键盘（iPad 外接键盘 / 电脑键盘）。
 * 在可编辑元素中输入时不拦截，避免影响输入框。
 */
export function useKeyboardInput(handlers: KeyboardInputHandlers) {
  /** 当前按下的物理键 code，用于屏幕键盘按下动画 */
  const pressed = ref<Set<string>>(new Set())

  function onKeyDown(e: KeyboardEvent) {
    if (isEditable(e.target)) return
    pressed.value = new Set(pressed.value).add(e.code)
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.isComposing) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      handlers.onBackspace?.(e)
    } else if (e.key === 'Enter') {
      handlers.onEnter?.(e)
    } else if (e.key === 'Escape') {
      handlers.onEscape?.(e)
    } else if (e.key.length === 1) {
      // 阻止空格滚动页面、Firefox 的 ' / 快速查找
      e.preventDefault()
      handlers.onChar?.(e.key, e)
    }
  }

  function onKeyUp(e: KeyboardEvent) {
    const next = new Set(pressed.value)
    next.delete(e.code)
    pressed.value = next
  }

  function onBlur() {
    pressed.value = new Set()
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
  })
  onBeforeUnmount(() => {
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', onBlur)
  })

  return { pressed }
}
