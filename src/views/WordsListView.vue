<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { WORD_BOOKS } from '@/data/words-en'
</script>

<template>
  <div class="page">
    <AppHeader title="🔤 英文单词" subtitle="看中文、打英文，单词和指法一起练" />
    <div class="page-body">
      <div class="books">
        <RouterLink v-for="b in WORD_BOOKS" :key="b.id" :to="`/practice/words/${b.id}`" class="book card">
          <span class="icon">{{ b.icon }}</span>
          <b>{{ b.title }}</b>
          <span class="preview">{{ b.words.slice(0, 4).map((w) => w.en).join(' · ') }} …</span>
          <span class="tag">{{ b.words.length }} 词</span>
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.books {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-top: 8px;
}

.book {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 20px;
  color: inherit;
  text-decoration: none;
}

.icon {
  font-size: 40px;
}

.book b {
  font-size: 20px;
}

.preview {
  font-size: 13px;
  color: var(--muted);
}

.tag {
  align-self: flex-start;
}
</style>
