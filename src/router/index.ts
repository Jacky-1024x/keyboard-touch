import { createRouter, createWebHashHistory } from 'vue-router'

// 使用 hash 路由：纯静态部署、添加到主屏幕均无需服务端配置
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', component: () => import('@/views/HomeView.vue') },
    { path: '/basic', component: () => import('@/views/BasicListView.vue') },
    { path: '/words', component: () => import('@/views/WordsListView.vue') },
    { path: '/articles/:lang(en|zh)', component: () => import('@/views/ArticleListView.vue'), props: true },
    { path: '/custom', component: () => import('@/views/CustomView.vue') },
    { path: '/games', component: () => import('@/views/GamesView.vue') },
    { path: '/games/balloon/:mode', component: () => import('@/views/games/BalloonGame.vue'), props: true },
    { path: '/games/chase', component: () => import('@/views/games/ChaseGame.vue') },
    { path: '/games/maze', component: () => import('@/views/games/MazeGame.vue') },
    { path: '/games/mole', component: () => import('@/views/games/MoleGame.vue') },
    { path: '/games/race', component: () => import('@/views/games/RaceGame.vue') },
    { path: '/games/space', component: () => import('@/views/games/SpaceGame.vue') },
    { path: '/practice/:kind/:id', component: () => import('@/views/PracticeView.vue'), props: true },
    { path: '/settings', component: () => import('@/views/SettingsView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})
