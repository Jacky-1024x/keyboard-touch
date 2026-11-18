<script setup lang="ts">
import { computed, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import { EN_ARTICLES, ZH_ARTICLES } from '@/data/articles'

const props = defineProps<{ lang: 'en' | 'zh' }>()

/** 中文文章：拼音打字 or 输入法直接打中文 */
const zhMode = ref<'zh-pinyin' | 'zh-hanzi'>('zh-pinyin')

const list = computed(() => (props.lang === 'en' ? EN_ARTICLES : ZH_ARTICLES))
const kind = computed(() => (props.lang === 'en' ? 'en-article' : zhMode.value))
const levelText = ['', '⭐', '⭐⭐', '⭐⭐⭐']
</script>

<template>
  <div class="page">
    <AppHeader
      :title="lang === 'en' ? '📖 英文文章' : '🀄 中文文章'"
      :subtitle="lang === 'en' ? '连贯输入，提升速度' : '古诗短文，拼音 / 中文两种练法'"
    >
      <template v-if="lang === 'zh'">
        <button class="btn sm" :class="{ on: zhMode === 'zh-pinyin' }" @click="zhMode = 'zh-pinyin'">拼音打字</button>
        <button class="btn sm" :class="{ on: zhMode === 'zh-hanzi' }" @click="zhMode = 'zh-hanzi'">
          中文输入（输入法）
        </button>
      </template>
    </AppHeader>
    <div class="page-body">
      <div class="articles">
        <RouterLink v-for="a in list" :key="a.id" :to="`/practice/${kind}/${a.id}`" class="article card">
          <div class="head">
            <b>{{ a.title }}</b>
            <span class="level">{{ levelText[a.level] }}</span>
          </div>
          <span v-if="a.source" class="source">{{ a.source }}</span>
          <p>{{ a.content }}</p>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.articles {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-top: 8px;
}

.article {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  color: inherit;
  text-decoration: none;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.head b {
  font-size: 20px;
}

.level {
  font-size: 12px;
}

.source {
  font-size: 13px;
  color: var(--muted);
}

p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #475569;
  white-space: pre-line;
  display: -webkit-box;
  -webkit-line-clamp: 4;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
