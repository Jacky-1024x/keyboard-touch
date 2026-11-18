<template>
  <div class="rotate-tip">
    <div class="icon">📱↻</div>
    <p>请把 iPad 横过来使用哦</p>
  </div>
</template>

<style scoped>
.rotate-tip {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 100;
  background: var(--bg);
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  color: #334155;
}

.icon {
  font-size: 64px;
}

/* 仅在平板/手机竖屏时提示，桌面窄窗口不提示 */
@media (orientation: portrait) and (max-width: 1024px) and (pointer: coarse) {
  .rotate-tip {
    display: flex;
  }
}
</style>
