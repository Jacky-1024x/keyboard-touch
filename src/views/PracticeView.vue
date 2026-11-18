<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import AppHeader from '@/components/AppHeader.vue'
import KeyPractice from '@/components/practice/KeyPractice.vue'
import ImePractice from '@/components/practice/ImePractice.vue'
import { resolvePractice, type PracticeKind, type PracticeSource } from '@/core/practice-sources'

const props = defineProps<{ kind: PracticeKind; id: string }>()

const source = ref<PracticeSource | null>(null)
const loading = ref(true)

const backPath = computed(() => {
  if (props.id === 'custom') return '/custom'
  switch (props.kind) {
    case 'basic':
      return '/basic'
    case 'words':
      return '/words'
    case 'en-article':
      return '/articles/en'
    default:
      return '/articles/zh'
  }
})

onMounted(async () => {
  source.value = await resolvePractice(props.kind, decodeURIComponent(props.id))
  loading.value = false
})
</script>

<template>
  <ImePractice v-if="source && kind === 'zh-hanzi'" :source="source" :back="backPath" />
  <KeyPractice v-else-if="source" :source="source" :back="backPath" />
  <div v-else class="page">
    <AppHeader :title="loading ? '加载中…' : '没有找到练习内容'" :back="backPath" />
  </div>
</template>
