import { createApp } from 'vue'
import App from './App.vue'
import { router } from './router'
import { sound } from './core/sound'
import './styles/global.css'

createApp(App).use(router).mount('#app')

// iOS Safari 需要用户交互后才能播放声音
const unlock = () => sound.unlock()
window.addEventListener('pointerdown', unlock, { once: true })
window.addEventListener('keydown', unlock, { once: true })
