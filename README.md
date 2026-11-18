# 小键盘手 · keyboard-touch

面向小学生的**纯 H5 键盘打字训练**项目，界面针对 **iPad 横屏 + 外接键盘**（类似笔记本电脑）优化，同样适用于电脑浏览器。

- 屏幕键盘实时提示下一个按键，按指法分区着色
- 手指示意图提示用哪根手指（入门练习显示，文章/速度练习默认隐藏）
- 基础键盘、英文单词（中英对照）、英文文章、中文文章（拼音 / 中文输入法）、自定义练习、打字游戏
- 纯前端，无后端，数据保存在浏览器 localStorage

## 快速开始

需要 Node.js 18+（推荐 20.19+）。

```bash
npm install
npm run dev        # 本地开发，默认 http://localhost:5173 ，同局域网 iPad 可用 Network 地址访问
npm run build      # 类型检查 + 打包到 dist/
npm run preview    # 预览打包结果
```

`dist/` 是纯静态文件（使用相对路径 + hash 路由），可直接部署到任意静态服务器、CDN 或 GitHub Pages。

## 自动部署（GitHub Pages）

在线地址：<https://jacky-1024x.github.io/keyboard-touch/>

仓库已配置 GitHub Actions（`.github/workflows/deploy.yml`）：

- 推送到 `main`：自动执行 `npm ci` → `npm run build` → 部署 `dist/` 到 GitHub Pages
- 向 `main` 提交 PR：只构建检查，不部署
- 也可以在 Actions 页面手动触发（workflow_dispatch）

本地**不需要**手动 build 或提交 `dist/`（已在 `.gitignore` 中忽略），写完代码直接 push 即可。

首次使用需在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**（只需设置一次）。

## 在 iPad 上使用

1. 推荐连接蓝牙键盘 / 妙控键盘 / 智能键盘。没有外接键盘时，也可以直接点击屏幕上的键盘输入。
2. Safari 打开页面后，点「分享 → 添加到主屏幕」，可以全屏无地址栏运行。
3. 横屏使用。竖屏时会提示旋转设备。
4. 拼音练习、英文练习**不需要**切换输入法；只有「中文输入（输入法）」模式需要切到中文输入法。

## 功能一览

| 模块 | 说明 | 状态 |
| --- | --- | --- |
| 基础键盘 | 4 关 22 课，从 F/J 开始逐步覆盖全键盘、数字、大写、标点 | ✅ |
| 英文单词 | 8 个主题词库，中文释义显示在单词上方 | ✅ |
| 英文文章 | 分级小短文，可显示译文 | ✅ |
| 中文文章 | 古诗/短文；拼音打字（汉字自动注音）或输入法直接打汉字 | ✅ |
| 自定义练习 | 粘贴任意文本：英文直接练，中文自动转拼音或用输入法练 | ✅ |
| 打字游戏 | 气球大作战：字母 / 单词 / 看中文打英文 / 拼音 四种模式 | ✅ 1 款，更多见路线图 |
| 设置与记录 | 音效、键盘、手指提示、文章纠错模式、练习记录 | ✅ |

## 文档

- [产品需求与功能设计](docs/PRD.md)
- [技术架构与开发指南](docs/ARCHITECTURE.md)（含如何添加课程、词库、文章、游戏）
- [iPad 横屏 UI 适配方案](docs/UI-LAYOUT.md)
- [开发路线图](docs/ROADMAP.md)

## 技术栈

Vue 3 + TypeScript + Vite + vue-router，中文转拼音使用 [pinyin-pro](https://github.com/zh-lx/pinyin-pro)。
