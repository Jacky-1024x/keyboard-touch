<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = withDefaults(
  defineProps<{
    title: string
    subtitle?: string
    /** 返回路径，默认回首页 */
    back?: string
  }>(),
  { back: '/' },
)

const router = useRouter()

function goBack() {
  router.push(props.back)
}
</script>

<template>
  <header class="app-header">
    <button class="nav-btn" aria-label="返回" @click="goBack">‹ 返回</button>
    <button v-if="back !== '/'" class="nav-btn icon" aria-label="首页" @click="router.push('/')">🏠</button>
    <div class="titles">
      <h1>{{ title }}</h1>
      <span v-if="subtitle" class="sub">{{ subtitle }}</span>
    </div>
    <div class="right">
      <slot />
    </div>
  </header>
</template>

<style scoped>
.app-header {
  height: var(--header-h);
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 var(--page-pad);
  padding-top: env(safe-area-inset-top);
  flex-shrink: 0;
}

.nav-btn {
  height: 40px;
  padding: 0 14px;
  border: none;
  border-radius: 12px;
  background: #fff;
  font-size: 16px;
  font-weight: 600;
  color: #334155;
  box-shadow: var(--shadow-sm);
  white-space: nowrap;
  flex-shrink: 0;
}

.nav-btn.icon {
  padding: 0 10px;
}

.nav-btn:active {
  transform: scale(0.95);
}

.titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
  margin-left: 4px;
}

h1 {
  margin: 0;
  font-size: 22px;
  white-space: nowrap;
}

.sub {
  font-size: 14px;
  color: #64748b;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
