import type { Segment } from './typing-session'
import { findLesson, generateLessonSegments } from '@/data/lessons'
import { findWordBook } from '@/data/words-en'
import {
  EN_ARTICLES,
  articlesOfCategory,
  catalogItems,
  findArticle,
  findCategory,
  type Article,
} from '@/data/articles'

export type PracticeKind = 'basic' | 'words' | 'en-article' | 'zh-pinyin' | 'zh-hanzi'

export const KIND_NAMES: Record<PracticeKind, string> = {
  basic: '基础键盘',
  words: '英文单词',
  'en-article': '英文文章',
  'zh-pinyin': '中文拼音',
  'zh-hanzi': '中文输入',
}

export interface CatalogEntry {
  id: string
  title: string
  source?: string
}

export interface PracticeSource {
  kind: PracticeKind
  title: string
  subtitle?: string
  segments: Segment[]
  /** 原文（中文输入法模式使用） */
  rawText: string
  translation?: string
  /** 入门类练习：强制打对才前进；手指提示 auto 模式下显示 */
  beginner: boolean
  /** 文章练习：同分类目录，用于页内切换 */
  catalog?: CatalogEntry[]
  catalogTitle?: string
  articleId?: string
  /** 重新生成内容（随机类练习） */
  regenerate?: () => Segment[]
}

function articleCatalog(lang: 'en' | 'zh', article: Article) {
  // 中文：同分类内切换；英文：全部文章可切换
  if (lang === 'en') {
    return {
      catalog: catalogItems(EN_ARTICLES),
      catalogTitle: '📖 英文文章',
      articleId: article.id,
    }
  }
  const cat = findCategory(lang, article.category)
  return {
    catalog: catalogItems(articlesOfCategory(lang, article.category)),
    catalogTitle: cat ? `${cat.icon} ${cat.title}` : '目录',
    articleId: article.id,
  }
}

const CUSTOM_KEY = 'kt:custom'

export interface CustomPractice {
  title: string
  text: string
}

export function saveCustomPractice(p: CustomPractice) {
  sessionStorage.setItem(CUSTOM_KEY, JSON.stringify(p))
}

function loadCustomPractice(): CustomPractice | null {
  try {
    return JSON.parse(sessionStorage.getItem(CUSTOM_KEY) || 'null')
  } catch {
    return null
  }
}

function shuffle<T>(list: T[]) {
  const arr = [...list]
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

/** 英文文本 → segments（按空白切词，换行保留为展示用） */
export function textToEnglishSegments(text: string): Segment[] {
  const out: Segment[] = []
  text
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .split('\n')
    .forEach((line, i) => {
      if (i > 0) out.push({ text: '', label: '\n', skip: true })
      line
        .split(/\s+/)
        .filter(Boolean)
        .forEach((w) => out.push({ text: w }))
    })
  return out
}

export async function resolvePractice(kind: PracticeKind, id: string): Promise<PracticeSource | null> {
  switch (kind) {
    case 'basic': {
      const lesson = findLesson(id)
      if (!lesson) return null
      const regenerate = () => generateLessonSegments(lesson)
      return {
        kind,
        title: lesson.title,
        subtitle: lesson.desc,
        segments: regenerate(),
        rawText: '',
        beginner: true,
        regenerate,
      }
    }
    case 'words': {
      const book = findWordBook(id)
      if (!book) return null
      const regenerate = () => shuffle(book.words).map((w) => ({ text: w.en, label: w.zh }))
      return {
        kind,
        title: `${book.icon} ${book.title}`,
        subtitle: `${book.words.length} 个单词`,
        segments: regenerate(),
        rawText: '',
        beginner: true,
        regenerate,
      }
    }
    case 'en-article': {
      const custom = id === 'custom' ? loadCustomPractice() : null
      const article = custom ? null : findArticle('en', id)
      const text = custom?.text ?? article?.content
      if (!text) return null
      return {
        kind,
        title: custom?.title ?? article!.title,
        subtitle: article?.source,
        segments: textToEnglishSegments(text),
        rawText: text,
        translation: article?.translation,
        beginner: false,
        ...(article ? articleCatalog('en', article) : {}),
      }
    }
    case 'zh-pinyin':
    case 'zh-hanzi': {
      const custom = id === 'custom' ? loadCustomPractice() : null
      const article = custom ? null : findArticle('zh', id)
      const text = custom?.text ?? article?.content
      if (!text) return null
      // pinyin-pro 词库较大，按需加载
      const { textToPinyinSegments } = await import('./pinyin')
      return {
        kind,
        title: custom?.title ?? article!.title,
        subtitle: article?.source,
        segments: kind === 'zh-pinyin' ? textToPinyinSegments(text) : [],
        rawText: text,
        beginner: false,
        ...(article ? articleCatalog('zh', article) : {}),
      }
    }
  }
}
