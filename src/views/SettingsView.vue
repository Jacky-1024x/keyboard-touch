<script setup lang="ts">
import AppHeader from '@/components/AppHeader.vue'
import { settings, type FingerMode } from '@/stores/settings'
import { records } from '@/stores/records'

const fingerModes: { value: FingerMode; label: string }[] = [
  { value: 'auto', label: '自动（入门显示，文章隐藏）' },
  { value: 'on', label: '总是显示' },
  { value: 'off', label: '总是隐藏' },
]

function fmt(ts: number) {
  const d = new Date(ts)
  return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

function clearRecords() {
  if (confirm('确定清空所有练习记录吗？')) records.list = []
}
</script>

<template>
  <div class="page">
    <AppHeader title="⚙️ 设置 / 记录" />
    <div class="page-body layout">
      <section class="card panel">
        <h3>设置</h3>
        <label class="row">
          <span>昵称</span>
          <input v-model="settings.nickname" maxlength="12" placeholder="小朋友的名字" />
        </label>
        <label class="row">
          <span>按键音效</span>
          <input v-model="settings.sound" type="checkbox" />
        </label>
        <label class="row">
          <span>显示屏幕键盘</span>
          <input v-model="settings.showKeyboard" type="checkbox" />
        </label>
        <label class="row">
          <span>键盘指法分区着色</span>
          <input v-model="settings.fingerColors" type="checkbox" />
        </label>
        <div class="row col">
          <span>手指提示</span>
          <div class="seg">
            <button
              v-for="m in fingerModes"
              :key="m.value"
              class="btn sm"
              :class="{ on: settings.fingerMode === m.value }"
              @click="settings.fingerMode = m.value"
            >
              {{ m.label }}
            </button>
          </div>
        </div>
        <label class="row">
          <span>
            文章练习允许打错继续
            <small>打错也会前进，可用退格键修改；关闭时必须打对才前进</small>
          </span>
          <input v-model="settings.articleFreeMode" type="checkbox" />
        </label>
      </section>

      <section class="card panel records">
        <div class="head">
          <h3>练习记录</h3>
          <button v-if="records.list.length" class="btn sm" @click="clearRecords">清空</button>
        </div>
        <p v-if="!records.list.length" class="empty">还没有练习记录，快去练习吧！</p>
        <table v-else>
          <thead>
            <tr><th>时间</th><th>类型</th><th>内容</th><th>速度</th><th>正确率</th><th>得分</th></tr>
          </thead>
          <tbody>
            <tr v-for="r in records.list" :key="r.at">
              <td>{{ fmt(r.at) }}</td>
              <td>{{ r.kind }}</td>
              <td>{{ r.title }}</td>
              <td>{{ r.speed }} {{ r.speedUnit }}</td>
              <td>{{ r.accuracy }}%</td>
              <td>{{ r.score ?? '-' }}</td>
            </tr>
          </tbody>
        </table>
      </section>
    </div>
  </div>
</template>

<style scoped>
.layout {
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 20px;
  align-items: start;
}

.panel {
  padding: 20px 24px;
}

h3 {
  margin: 0 0 12px;
}

.row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f1f5f9;
}

.row.col {
  flex-direction: column;
  align-items: flex-start;
}

.row small {
  display: block;
  font-size: 12px;
  color: var(--muted);
}

.row input[type='checkbox'] {
  width: 22px;
  height: 22px;
}

.row input:not([type]) {
  height: 36px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 0 12px;
  font-size: 15px;
}

.seg {
  display: flex;
  flex-direction: column;
  gap: 6px;
  width: 100%;
}

.records .head {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty {
  color: var(--muted);
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  text-align: left;
  padding: 8px 6px;
  border-bottom: 1px solid #f1f5f9;
}

th {
  color: var(--muted);
  font-weight: 500;
}
</style>
