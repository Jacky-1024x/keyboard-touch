<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import AppHeader from '@/components/AppHeader.vue'
import { saveCustomPractice, type PracticeKind } from '@/core/practice-sources'
import type { Segment } from '@/core/typing-session'

const router = useRouter()
const title = ref('')
const text = ref('')
const preview = ref<Segment[]>([])

const isZh = computed(() => /[\u3400-\u9fff]/.test(text.value))
const tooLong = computed(() => text.value.length > 2000)

// 输入中文时实时预览拼音
let seq = 0
watch(
  text,
  async (val) => {
    const my = ++seq
    if (!isZh.value) return (preview.value = [])
    const { textToPinyinSegments } = await import('@/core/pinyin')
    if (my === seq) preview.value = textToPinyinSegments(val.slice(0, 60))
  },
)

function start(kind: PracticeKind) {
  const content = text.value.trim()
  if (!content) return
  saveCustomPractice({ title: title.value.trim() || '自定义练习', text: content })
  router.push(`/practice/${kind}/custom`)
}

const samples = [
  { title: 'Twinkle Star', text: 'Twinkle, twinkle, little star,\nHow I wonder what you are.' },
  { title: '画', text: '远看山有色，\n近听水无声。\n春去花还在，\n人来鸟不惊。' },
]
</script>

<template>
  <div class="page">
    <AppHeader title="✏️ 自定义练习" subtitle="输入英文或中文，中文会自动转换成拼音来练习" />
    <div class="page-body layout">
      <section class="editor card">
        <input v-model="title" class="title" placeholder="练习标题（可选）" maxlength="30" />
        <textarea v-model="text" placeholder="在这里输入或粘贴要练习的内容……&#10;英文：直接按英文练习&#10;中文：可选择拼音练习，或用输入法直接打中文" />
        <div class="footer">
          <span class="count" :class="{ warn: tooLong }">{{ text.length }} / 2000</span>
          <div class="samples">
            示例：
            <button v-for="s in samples" :key="s.title" class="btn sm" @click="(title = s.title), (text = s.text)">
              {{ s.title }}
            </button>
          </div>
        </div>
      </section>

      <aside class="side">
        <div class="card actions">
          <template v-if="isZh">
            <button class="btn primary big" :disabled="!text.trim() || tooLong" @click="start('zh-pinyin')">
              🔤 拼音练习
              <small>汉字自动转拼音，打拼音字母</small>
            </button>
            <button class="btn big" :disabled="!text.trim() || tooLong" @click="start('zh-hanzi')">
              🀄 中文输入练习
              <small>用输入法直接打汉字</small>
            </button>
          </template>
          <button v-else class="btn primary big" :disabled="!text.trim() || tooLong" @click="start('en-article')">
            🔠 英文练习
            <small>逐字母对照输入</small>
          </button>
        </div>

        <div v-if="preview.length" class="card preview">
          <h4>拼音预览</h4>
          <div class="ruby">
            <span v-for="(s, i) in preview" :key="i" :class="{ br: s.label === '\n' }">
              <template v-if="s.label !== '\n'">
                <small>{{ s.skip ? '' : s.sub || s.text }}</small>{{ s.label }}
              </template>
            </span>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 1fr 340px;
  gap: 20px;
}

.editor {
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: 0;
}

.title {
  height: 44px;
  border: none;
  border-bottom: 1px solid #e2e8f0;
  font-size: 18px;
  outline: none;
  margin-bottom: 12px;
}

textarea {
  flex: 1;
  min-height: 300px;
  border: none;
  resize: none;
  outline: none;
  font-size: 20px;
  line-height: 1.7;
  font-family: inherit;
}

.footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid #f1f5f9;
}

.count {
  font-size: 13px;
  color: var(--muted);
}

.count.warn {
  color: #ef4444;
}

.samples {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}

.side {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px;
}

.btn.big {
  height: auto;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 18px;
}

.btn.big small {
  font-size: 12px;
  font-weight: 400;
  opacity: 0.8;
}

.btn:disabled {
  opacity: 0.5;
}

.preview {
  padding: 16px 20px;
}

.preview h4 {
  margin: 0 0 8px;
}

.ruby {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 2px;
  font-size: 22px;
}

.ruby span {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
}

.ruby .br {
  flex-basis: 100%;
}

.ruby small {
  font-size: 12px;
  color: var(--primary-dark);
  min-height: 1.2em;
}
</style>
