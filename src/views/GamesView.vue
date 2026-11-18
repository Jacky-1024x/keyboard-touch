<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'

const balloonModes = [
  { mode: 'letter', title: '字母气球', desc: '打出气球上的字母', icon: '🅰️' },
  { mode: 'word', title: '单词气球', desc: '英文单词（带中文）', icon: '🔤' },
  { mode: 'zh-en', title: '看中文打英文', desc: '只显示中文，考考你', icon: '🧠' },
  { mode: 'pinyin', title: '拼音气球', desc: '看汉字打拼音', icon: '🀄' },
]

const upcoming = [
  { title: '打地鼠', icon: '🐹', desc: '地鼠举着字母冒出来' },
  { title: '打字赛车', icon: '🏎️', desc: '打得越快车越快' },
  { title: '太空保卫战', icon: '🚀', desc: '打出单词击落陨石' },
]
</script>

<template>
  <div class="page">
    <AppHeader title="🎈 打字游戏" subtitle="边玩边练，越打越快" />
    <div class="page-body">
      <h3 class="section-title">🎈 气球大作战</h3>
      <div class="grid-cards">
        <RouterLink v-for="m in balloonModes" :key="m.mode" :to="`/games/balloon/${m.mode}`" class="game card">
          <span class="icon">{{ m.icon }}</span>
          <b>{{ m.title }}</b>
          <span class="desc">{{ m.desc }}</span>
        </RouterLink>
      </div>

      <h3 class="section-title">即将上线</h3>
      <div class="grid-cards">
        <div v-for="g in upcoming" :key="g.title" class="game card disabled">
          <span class="icon">{{ g.icon }}</span>
          <b>{{ g.title }}</b>
          <span class="desc">{{ g.desc }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  color: inherit;
  text-decoration: none;
}

.game.disabled {
  opacity: 0.5;
}

.icon {
  font-size: 40px;
}

.game b {
  font-size: 20px;
}

.desc {
  font-size: 13px;
  color: var(--muted);
}
</style>
