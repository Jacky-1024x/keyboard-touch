<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { LESSON_STAGES } from '@/data/lessons'
</script>

<template>
  <div class="page">
    <AppHeader title="⌨️ 基础键盘" subtitle="从基准键开始，一步步学会盲打" />
    <div class="page-body">
      <section v-for="stage in LESSON_STAGES" :key="stage.title">
        <h3 class="section-title">{{ stage.title }}</h3>
        <div class="lessons">
          <RouterLink
            v-for="(l, i) in stage.lessons"
            :key="l.id"
            :to="`/practice/basic/${encodeURIComponent(l.id)}`"
            class="lesson card"
          >
            <span class="no">{{ i + 1 }}</span>
            <b>{{ l.title }}</b>
            <span class="desc">{{ l.desc }}</span>
          </RouterLink>
        </div>
      </section>
    </div>
  </div>
</template>

<style scoped>
.lessons {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}

.lesson {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 16px;
  color: inherit;
  text-decoration: none;
}

.lesson:active {
  transform: scale(0.97);
}

.no {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #dbeafe;
  color: var(--primary-dark);
  display: grid;
  place-items: center;
  font-weight: 700;
  font-size: 14px;
}

.lesson b {
  font-size: 18px;
}

.desc {
  font-size: 13px;
  color: var(--muted);
}
</style>
