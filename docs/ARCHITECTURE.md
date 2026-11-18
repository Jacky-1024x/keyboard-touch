# 技术架构与开发指南

## 1. 技术选型

| 项 | 选择 | 原因 |
| --- | --- | --- |
| 框架 | Vue 3（`<script setup>` + Composition API） | 轻量、上手快，组合式函数便于复用打字逻辑 |
| 语言 | TypeScript（strict） | 键位、练习数据结构清晰 |
| 构建 | Vite | 开发快，产物为纯静态文件 |
| 路由 | vue-router，**hash 模式** | 静态部署 / 添加到主屏幕无需服务端配置 |
| 拼音 | pinyin-pro | 准确率高，支持多音字词语，动态 import 按需加载 |
| 状态 | 自定义 `persistedReactive`（reactive + localStorage） | 状态很少，无需 Pinia |
| 音效 | Web Audio API 合成 | 无需音频文件 |

## 2. 目录结构

```
src/
├── main.ts                     入口：挂载应用、解锁 iOS 音频
├── App.vue                     RouterView + 竖屏提示
├── router/index.ts             路由表（全部懒加载）
├── styles/global.css           全局样式、CSS 变量、键盘尺寸 --key 计算
├── core/                       与 UI 无关的核心逻辑
│   ├── keyboard-layout.ts      键盘布局、指法映射、字符→按键查找
│   ├── typing-session.ts       打字会话（逐字符比对、计时、速度、正确率）
│   ├── use-keyboard-input.ts   全局实体键盘监听
│   ├── pinyin.ts               中文 → 拼音 segments（按需加载）
│   ├── practice-sources.ts     根据 kind + id 生成练习内容
│   └── sound.ts                按键/错误/成功音效
├── stores/
│   ├── persist.ts              持久化 reactive 工具
│   ├── settings.ts             用户设置
│   └── records.ts              练习记录、星级计算
├── data/                       静态练习内容
│   ├── lessons.ts              基础键盘课程 + 随机生成
│   ├── words-en.ts             英文单词词库（中英对照）
│   ├── words-zh.ts             拼音游戏用中文词
│   └── articles.ts             英文 / 中文文章
├── components/
│   ├── VirtualKeyboard.vue     屏幕键盘
│   ├── HandsGuide.vue          双手示意图 + 文字说明
│   ├── HandShape.vue           单只手 SVG
│   ├── KeyboardDock.vue        键盘 + 手指组合
│   ├── TypingText.vue          练习文本渲染（标签行 + 字符行）
│   ├── StatsBar.vue            用时 / 速度 / 正确率 / 进度
│   ├── ResultDialog.vue        结果弹窗（星级）
│   ├── AppHeader.vue           页头
│   ├── RotateTip.vue           竖屏提示
│   └── practice/
│       ├── KeyPractice.vue     按键类练习页（基础/单词/文章/拼音）
│       └── ImePractice.vue     输入法类练习页（中文输入）
└── views/
    ├── HomeView.vue            首页
    ├── BasicListView.vue       课程列表
    ├── WordsListView.vue       词库列表
    ├── ArticleListView.vue     文章列表（en / zh）
    ├── CustomView.vue          自定义练习
    ├── GamesView.vue           游戏列表
    ├── games/BalloonGame.vue   气球大作战
    ├── PracticeView.vue        练习页：加载内容，分发到 KeyPractice / ImePractice
    └── SettingsView.vue        设置与记录
```

## 3. 路由

| 路径 | 页面 |
| --- | --- |
| `/` | 首页 |
| `/basic` `/words` `/articles/en` `/articles/zh` | 各模块列表 |
| `/practice/:kind/:id` | 统一练习页。`kind` ∈ `basic` `words` `en-article` `zh-pinyin` `zh-hanzi`；`id` 为课程/词库/文章 id，`custom` 表示自定义内容 |
| `/custom` | 自定义练习编辑 |
| `/games` `/games/balloon/:mode` | 游戏列表 / 气球游戏（`letter` `word` `zh-en` `pinyin`） |
| `/settings` | 设置与记录 |

## 4. 核心模型

### 4.1 Segment → Cell

所有按键类练习统一抽象为 `Segment[]`：

```ts
interface Segment {
  text: string    // 需要键入的内容
  label?: string  // 上方提示：汉字 / 中文释义
  sub?: string    // 次级提示：带声调拼音
  skip?: boolean  // 只展示不输入：标点、换行
}
```

| 练习 | 一个 Segment | 示例 |
| --- | --- | --- |
| 基础键盘 | 一组字符 | `{ text: 'fjfj' }` |
| 英文单词 | 一个单词 | `{ text: 'cat', label: '猫' }` |
| 英文文章 | 一个词（含标点） | `{ text: 'Hello,' }` |
| 拼音 | 一个汉字 | `{ text: 'chuang', label: '床', sub: 'chuáng' }` |

`buildCells()` 把 segments 展开为逐字符的 `Cell[]`，相邻需要输入的 segment 之间自动插入分隔符（空格）。`useTypingSession()` 只处理 cells：比对、推进下标、统计。`TypingText` 再按 segment 分组渲染，实现“上方汉字/释义 + 下方字符”的对照效果。

### 4.2 useTypingSession

```ts
const session = useTypingSession({ mode: 'block' | 'free', hanziSpeed: boolean })
session.load(segments)
session.input(ch)      // 返回 'correct' | 'wrong' | 'ignored'
session.backspace()    // 仅 free 模式
session.expected       // 下一个字符 → 屏幕键盘高亮 & 手指提示
session.speed / accuracy / progress / elapsedMs / finished
session.result()
```

### 4.3 指法映射

`keyboard-layout.ts` 中每个键记录 `code`（与 `KeyboardEvent.code` 一致）、主/Shift 字符、宽度、手指。`findKeyByChar(ch)` 返回按键和是否需要 Shift；`fingersForChar(ch)` 返回需要的手指（大写/符号会额外返回另一只手的小指）。

### 4.4 输入来源

- **实体键盘**：`useKeyboardInput` 监听 `window` 的 `keydown`，取 `e.key` 单字符；焦点在输入框内时不拦截。iPad 外接键盘在非输入框焦点下发送的是原始按键，不受系统中文输入法影响。
- **屏幕键盘**：`VirtualKeyboard` 的 `pointerdown` 触发 `press` 事件，作为无外接键盘时的兜底。
- **输入法**：`ImePractice` 使用 `<textarea>`，通过 `compositionstart/end` 只比对已上屏的文字。

## 5. 如何扩展内容

### 添加基础课程

编辑 `src/data/lessons.ts`，在对应关卡加入：

```ts
{ id: 'my-lesson', title: '标题', desc: '说明', newKeys: '新键', pool: '全部可用键', groups: 12 }
// 或固定内容
{ id: 'x', title: '...', desc: '...', newKeys: '', pool: '', fixed: ['abc', 'def'] }
```

### 添加单词本

编辑 `src/data/words-en.ts`，向 `WORD_BOOKS` 追加 `{ id, title, icon, words: [{ en, zh }] }`。

### 添加文章

编辑 `src/data/articles.ts`：英文加入 `EN_ARTICLES`（可带 `translation`），中文加入 `ZH_ARTICLES`（用 `\n` 分行）。拼音自动生成，无需手写。

### 添加新游戏

1. 在 `src/views/games/` 新建页面，使用 `useKeyboardInput` 接收按键、`sound` 播放音效、`addRecord` 记录结果、`ResultDialog` 展示结果。
2. 在 `src/router/index.ts` 注册路由。
3. 在 `src/views/GamesView.vue` 添加入口。
4. 拼音类游戏通过 `await import('@/core/pinyin')` 按需加载 `wordToPinyin`。

## 6. 约定

- 业务逻辑放在 `core/`，组件只负责展示和事件转发。
- 所有尺寸跟随 CSS 变量 `--key`（一个字母键的宽度），不要在键盘/手指相关样式里写死像素。
- 本地存储 key 统一前缀 `kt:`。
- 提交前执行 `npm run build`（含 `vue-tsc` 类型检查）。

## 7. 已知注意事项

- 在 `<svg>` 上使用 `v-for` 且数据源是 `<script setup>` 中的常量数组时，Vue 会把它编译为稳定片段，更新时可能丢失 SVG 命名空间并报 `Cannot set property className of SVGElement`。因此单只手拆为独立组件 `HandShape.vue`。
- iOS Safari 必须在用户手势后才能播放声音，`main.ts` 在首次 `pointerdown` / `keydown` 时解锁 AudioContext。
