<script setup lang="ts">
export interface CatalogItem {
  id: string
  title: string
  source?: string
}

defineProps<{
  open: boolean
  title: string
  items: CatalogItem[]
  currentId: string
}>()

defineEmits<{
  (e: 'close'): void
  (e: 'select', id: string): void
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="open" class="mask" @click.self="$emit('close')">
      <aside class="panel" role="dialog" aria-label="文章目录">
        <header>
          <h3>{{ title }}</h3>
          <button class="btn sm" @click="$emit('close')">关闭</button>
        </header>
        <nav>
          <button
            v-for="(item, i) in items"
            :key="item.id"
            type="button"
            class="row"
            :class="{ on: item.id === currentId }"
            @click="$emit('select', item.id)"
          >
            <span class="no">{{ i + 1 }}</span>
            <span class="meta">
              <b>{{ item.title }}</b>
              <small v-if="item.source">{{ item.source }}</small>
            </span>
          </button>
        </nav>
      </aside>
    </div>
  </Teleport>
</template>

<style scoped>
.mask {
  position: fixed;
  inset: 0;
  z-index: 60;
  background: rgb(15 23 42 / 0.4);
  display: flex;
  justify-content: flex-end;
  animation: fade 0.15s;
}

.panel {
  width: min(420px, 88vw);
  height: 100%;
  background: #fff;
  box-shadow: -8px 0 32px rgb(0 0 0 / 0.15);
  display: flex;
  flex-direction: column;
  animation: slide 0.2s ease-out;
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
}

header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

h3 {
  margin: 0;
  font-size: 18px;
}

nav {
  flex: 1;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 8px 0;
}

.row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 20px;
  border: none;
  background: transparent;
  text-align: left;
  color: inherit;
  cursor: pointer;
  border-bottom: 1px solid #f8fafc;
}

.row:active {
  background: #f1f5f9;
}

.row.on {
  background: #eff6ff;
}

.no {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #e2e8f0;
  color: #475569;
  display: grid;
  place-items: center;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
}

.row.on .no {
  background: #2563eb;
  color: #fff;
}

.meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
}

.meta b {
  font-size: 16px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.meta small {
  font-size: 13px;
  color: #64748b;
}

@keyframes fade {
  from {
    opacity: 0;
  }
}

@keyframes slide {
  from {
    transform: translateX(100%);
  }
}
</style>
