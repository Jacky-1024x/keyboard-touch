import {
  EN_ARTICLES,
  EN_CATEGORIES,
  articlesOfCategory,
  findArticle,
} from '@/data/articles'
import { WORD_BOOKS, findWordBook } from '@/data/words-en'
import { textToEnglishSegments } from './practice-sources'
import type { Segment } from './typing-session'

export type ChaseCategoryId = 'words' | 'en' | 'tang' | 'song' | 'classic'

export interface ChaseCategory {
  id: ChaseCategoryId
  title: string
  icon: string
  kind: 'words' | 'en' | 'zh'
  hanzi: boolean
  unit: '组' | '篇'
  /** 列表卡片上的短说明 */
  card: string
  /** 选关页：这一类到底打什么 */
  how: string
}

export interface ChasePiece {
  id: string
  title: string
  source?: string
  level: 1 | 2 | 3
  group: string
}

/**
 * 只列出数据里真实存在的类别。
 * 宋词没有单独分类，和宋诗一起放在 articles 的 song（宋诗宋词）里。
 */
export const CHASE_CATEGORIES: ChaseCategory[] = [
  {
    id: 'words',
    title: '英文单词',
    icon: '🔤',
    kind: 'words',
    hanzi: false,
    unit: '组',
    card: '打英文单词，一组主题词库算一篇',
    how: '打小写英文字母。单词上面有中文意思，词和词之间打空格。顺序和词库里一样。',
  },
  {
    id: 'en',
    title: '英文文章',
    icon: '📘',
    kind: 'en',
    hanzi: false,
    unit: '篇',
    card: '打英文原文，大小写和标点都要打',
    how: '按原文打：大写要按 Shift，标点也要打，词和词之间打空格。',
  },
  {
    id: 'tang',
    title: '唐诗',
    icon: '📜',
    kind: 'zh',
    hanzi: true,
    unit: '篇',
    card: '看唐诗，打无声调拼音',
    how: '看汉字打拼音，不标声调，ü 打 v。标点和空行不用打。',
  },
  {
    id: 'song',
    title: '宋诗宋词',
    icon: '🎐',
    kind: 'zh',
    hanzi: true,
    unit: '篇',
    card: '看宋诗宋词，打无声调拼音',
    how: '词库里宋诗和宋词在同一类，没有单独的宋词目录。看汉字打拼音，ü 打 v，标点不用打。',
  },
  {
    id: 'classic',
    title: '古文',
    icon: '📖',
    kind: 'zh',
    hanzi: true,
    unit: '篇',
    card: '看古文，打无声调拼音',
    how: '看汉字打拼音，不标声调，ü 打 v。标点和空行不用打。',
  },
]

export function listPieces(categoryId: ChaseCategoryId): ChasePiece[] {
  if (categoryId === 'words') {
    return WORD_BOOKS.map((book) => ({
      id: book.id,
      title: `${book.icon} ${book.title}`,
      source: `${book.words.length} 个单词`,
      level: 1 as const,
      group: '',
    }))
  }
  if (categoryId === 'en') {
    return EN_ARTICLES.map((article) => ({
      id: article.id,
      title: article.title,
      source: article.source,
      level: article.level,
      group: EN_CATEGORIES.find((item) => item.id === article.category)?.desc ?? '',
    }))
  }
  return articlesOfCategory('zh', categoryId).map((article) => ({
    id: article.id,
    title: article.title,
    source: article.source,
    level: article.level,
    group: '',
  }))
}

/** 和练习页同一套切分：英文原文、单词、拼音（ü→v，标点跳过）。 */
export async function segmentsFor(categoryId: ChaseCategoryId, pieceId: string): Promise<Segment[]> {
  if (categoryId === 'words') {
    const book = findWordBook(pieceId)
    if (!book) return []
    return book.words.map((word) => ({ text: word.en, label: word.zh }))
  }
  if (categoryId === 'en') {
    const article = findArticle('en', pieceId)
    if (!article) return []
    return textToEnglishSegments(article.content)
  }
  const article = findArticle('zh', pieceId)
  if (!article) return []
  const { textToPinyinSegments } = await import('@/core/pinyin')
  return textToPinyinSegments(article.content)
}
