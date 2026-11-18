<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{
  title: string
  subtitle?: string
  /** 返回路径，不传则回首页 */
  back?: string | false
}>()

const router = useRouter()

function goBack() {
  router.push(props.back || '/')
}
</script>

<template>
  <header class="app-header">
    <button v-if="back !== false" class="back" aria-label="返回" @click="goBack">‹</button>
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
  gap: 12px;
  padding: 0 var(--page-pad);
  padding-top: env(safe-area-inset-top);
  flex-shrink: 0;
}

.back {
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 12px;
  background: #fff;
  font-size: 30px;
  line-height: 1;
  color: #334155;
  box-shadow: var(--shadow-sm);
}

.titles {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
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
}
</style>
