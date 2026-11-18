import { reactive, watch } from 'vue'

const PREFIX = 'kt:'

/** 创建一个自动持久化到 localStorage 的响应式对象 */
export function persistedReactive<T extends object>(key: string, defaults: T): T {
  let saved: Partial<T> = {}
  try {
    saved = JSON.parse(localStorage.getItem(PREFIX + key) || '{}')
  } catch {
    saved = {}
  }
  const state = reactive({ ...defaults, ...saved }) as T
  watch(
    () => state,
    (val) => localStorage.setItem(PREFIX + key, JSON.stringify(val)),
    { deep: true },
  )
  return state
}
