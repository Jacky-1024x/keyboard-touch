<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import {
  EN_ARTICLES,
  EN_CATEGORIES,
  ZH_CATEGORIES,
  articlesOfCategory,
  type ZhCategoryId,
} from '@/data/articles'

const props = defineProps<{ lang: 'en' | 'zh' }>()
const router = useRouter()

/** 中文文章：拼音打字 or 输入法直接打中文 */
const zhMode = ref<'zh-pinyin' | 'zh-hanzi'>(
  (sessionStorage.getItem('kt:zh-mode') as 'zh-pinyin' | 'zh-hanzi') || 'zh-pinyin',
)

watch(zhMode, (m) => sessionStorage.setItem('kt:zh-mode', m))

const enCategories = EN_CATEGORIES.map((c) => ({
  ...c,
  articles: articlesOfCategory('en', c.id),
}))

const zhCount = computed(() =>
  Object.fromEntries(ZH_CATEGORIES.map((c) => [c.id, articlesOfCategory('zh', c.id).length])),
)

function openZh(category: ZhCategoryId) {
  const list = articlesOfCategory('zh', category)
  if (!list.length) return
  router.push(`/practice/${zhMode.value}/${list[0].id}`)
}

function openEn(id: string) {
  router.push(`/practice/en-article/${id}`)
}
</script>

<template>
  <div class="page">
    <!-- 中文：四大分类，点进去自动进入第一篇 -->
    <template v-if="lang === 'zh'">
      <AppHeader title="🀄 中文文章" subtitle="选分类后自动进入练习，可用目录切换篇目">
        <button class="btn sm" :class="{ on: zhMode === 'zh-pinyin' }" @click="zhMode = 'zh-pinyin'">拼音打字</button>
        <button class="btn sm" :class="{ on: zhMode === 'zh-hanzi' }" @click="zhMode = 'zh-hanzi'">中文输入</button>
      </AppHeader>
      <div class="page-body">
        <div class="cats">
          <button v-for="c in ZH_CATEGORIES" :key="c.id" type="button" class="cat card" @click="openZh(c.id)">
            <span class="icon">{{ c.icon }}</span>
            <div class="info">
              <b>{{ c.title }}</b>
              <span class="desc">{{ c.desc }}</span>
            </div>
            <span class="count">{{ zhCount[c.id] }} 篇 ›</span>
          </button>
        </div>
        <p class="tip">进入后点右上角「目录」可切换同分类的其他文章。</p>
      </div>
    </template>

    <!-- 英文：竖列目录，标题 + 出处 -->
    <template v-else>
      <AppHeader title="📖 英文文章" subtitle="经典寓言 · 童谣 · 短文" />
      <div class="page-body">
        <section v-for="c in enCategories" :key="c.id" class="group">
          <h3 class="section-title">{{ c.icon }} {{ c.title }} <small>{{ c.desc }}</small></h3>
          <div class="list card">
            <button
              v-for="(a, i) in c.articles"
              :key="a.id"
              type="button"
              class="row"
              @click="openEn(a.id)"
            >
              <span class="no">{{ i + 1 }}</span>
              <span class="meta">
                <b>{{ a.title }}</b>
                <small>{{ a.source }}</small>
              </span>
              <span class="level">{{ '⭐'.repeat(a.level) }}</span>
            </button>
          </div>
        </section>
        <p class="tip">练习中也可点「目录」快速切换其他文章。共 {{ EN_ARTICLES.length }} 篇。</p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.cats {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  margin-top: 8px;
}

.cat {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border: none;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.cat:active {
  transform: scale(0.98);
}

.icon {
  font-size: 40px;
  flex-shrink: 0;
}

.info {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
  min-width: 0;
}

.info b {
  font-size: 22px;
}

.desc {
  font-size: 14px;
  color: var(--muted);
}

.count {
  font-size: 14px;
  color: var(--primary-dark);
  font-weight: 600;
  white-space: nowrap;
}

.group {
  margin-bottom: 8px;
}

.section-title small {
  margin-left: 8px;
  font-weight: 400;
  color: var(--muted);
  font-size: 13px;
}

.list {
  overflow: hidden;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 14px 18px;
  border: none;
  border-bottom: 1px solid #f1f5f9;
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;
}

.row:last-child {
  border-bottom: none;
}

.row:active {
  background: #f8fafc;
}

.no {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #eef2ff;
  color: #4f46e5;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-width: 0;
}

.meta b {
  font-size: 16px;
  font-weight: 600;
}

.meta small {
  font-size: 13px;
  color: var(--muted);
}

.level {
  font-size: 12px;
  flex-shrink: 0;
}

.tip {
  margin: 20px 0 8px;
  font-size: 13px;
  color: var(--muted);
  text-align: center;
}
</style>
