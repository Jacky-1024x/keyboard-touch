<script setup lang="ts">
import { computed } from 'vue'
import { records } from '@/stores/records'
import { settings } from '@/stores/settings'

const modules = [
  { to: '/basic', icon: '⌨️', title: '基础键盘', desc: '认识键位，学习正确指法', color: '#60a5fa' },
  { to: '/words', icon: '🔤', title: '英文单词', desc: '中英对照，边打边记', color: '#34d399' },
  { to: '/articles/en', icon: '📖', title: '英文文章', desc: '小短文，练连贯输入', color: '#a78bfa' },
  { to: '/articles/zh', icon: '🀄', title: '中文文章', desc: '拼音打字 / 中文输入', color: '#f87171' },
  { to: '/custom', icon: '✏️', title: '自定义练习', desc: '粘贴任意中英文来练', color: '#fbbf24' },
  { to: '/games', icon: '🎈', title: '打字游戏', desc: '边玩边练，越打越快', color: '#fb7185' },
]

const recent = computed(() => records.list.slice(0, 5))

function fmt(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}
</script>

<template>
  <div class="page home">
    <header class="hero">
      <div>
        <h1>小键盘手 <span>⌨️</span></h1>
        <p>{{ settings.nickname ? `${settings.nickname}，` : '' }}今天也来练练打字吧！</p>
      </div>
      <RouterLink to="/settings" class="btn">⚙️ 设置 / 记录</RouterLink>
    </header>

    <div class="page-body">
      <div class="modules">
        <RouterLink v-for="m in modules" :key="m.to" :to="m.to" class="module card" :style="{ '--c': m.color }">
          <span class="icon">{{ m.icon }}</span>
          <b>{{ m.title }}</b>
          <span class="desc">{{ m.desc }}</span>
        </RouterLink>
      </div>

      <template v-if="recent.length">
        <h3 class="section-title">最近练习</h3>
        <div class="recent card">
          <div v-for="r in recent" :key="r.at" class="row">
            <span class="time">{{ fmt(r.at) }}</span>
            <span class="title">{{ r.title }}</span>
            <span v-if="r.score !== undefined">{{ r.score }} 分</span>
            <span>{{ r.speed }} {{ r.speedUnit }}</span>
            <span>{{ r.accuracy }}%</span>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.hero {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px var(--page-pad) 8px;
}

.hero h1 {
  margin: 0;
  font-size: 34px;
}

.hero p {
  margin: 6px 0 0;
  color: var(--muted);
}

.hero .btn {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

/* iPad 横屏：3 列 × 2 行 */
.modules {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-top: 16px;
}

.module {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 24px;
  min-height: 160px;
  color: inherit;
  text-decoration: none;
  overflow: hidden;
  border-top: 6px solid var(--c);
  transition: transform 0.15s;
}

.module:active {
  transform: scale(0.97);
}

.module .icon {
  font-size: 44px;
}

.module b {
  font-size: 22px;
}

.module .desc {
  color: var(--muted);
  font-size: 14px;
}

.recent {
  padding: 8px 20px;
}

.row {
  display: flex;
  gap: 24px;
  padding: 10px 0;
  border-bottom: 1px solid #f1f5f9;
  font-size: 14px;
}

.row:last-child {
  border-bottom: none;
}

.row .time {
  color: var(--muted);
  width: 90px;
}

.row .title {
  flex: 1;
}
</style>
