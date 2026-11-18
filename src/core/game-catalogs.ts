import { EN_ARTICLES, EN_CATEGORIES, ZH_CATEGORIES, articlesOfCategory, findArticle } from '@/data/articles'
import { WORD_BOOKS, ALL_WORDS, findWordBook, type WordItem } from '@/data/words-en'
import { ZH_GAME_WORDS, ZH_PRAISE } from '@/data/words-zh'
import { textToEnglishSegments } from './practice-sources'
import type { Segment } from './typing-session'

export type CatalogKind = 'home' | 'en' | 'zh'

export interface GameCatalogItem {
  id: string
  title: string
  source?: string
  kind: CatalogKind
  /** 词库或分组键。基准键为 home。 */
  key: string
}

const ZH_SINGLE = ZH_GAME_WORDS.filter((word) => word.length === 1)
const ZH_PHRASE = ZH_GAME_WORDS.filter((word) => word.length > 1)

export const MOLE_CATALOG: GameCatalogItem[] = [
  { id: 'home', title: '基准键', source: 'ASDF JKL;', kind: 'home', key: 'home' },
  { id: 'en:all', title: '全部英文单词', source: `${ALL_WORDS.length} 个单词，打完整单词`, kind: 'en', key: 'all' },
  ...WORD_BOOKS.map((book) => ({
    id: `en:${book.id}`,
    title: `${book.icon} ${book.title}`,
    source: `${book.words.length} 个英文单词`,
    kind: 'en' as const,
    key: book.id,
  })),
  { id: 'zh:single', title: '常用单字', source: `${ZH_SINGLE.length} 个汉字，打完整拼音`, kind: 'zh', key: 'single' },
  { id: 'zh:phrase', title: '双字词语', source: `${ZH_PHRASE.length} 个词语，打完整拼音`, kind: 'zh', key: 'phrase' },
  { id: 'zh:all', title: '全部中文词语', source: `${ZH_GAME_WORDS.length} 个，汉字与拼音对照`, kind: 'zh', key: 'all' },
]

export const SPACE_CATALOG: GameCatalogItem[] = [
  { id: 'en:all', title: '全部英文单词', source: '打英文单词，下面是中文意思', kind: 'en', key: 'all' },
  ...WORD_BOOKS.map((book) => ({
    id: `en:${book.id}`,
    title: `${book.icon} ${book.title}`,
    source: `${book.words.length} 个英文单词`,
    kind: 'en' as const,
    key: book.id,
  })),
  { id: 'zh:praise', title: '课堂评语', source: '结算里已有的表扬短句，打拼音', kind: 'zh', key: 'praise' },
  { id: 'zh:single', title: '常用单字', source: `${ZH_SINGLE.length} 个汉字，打整词拼音`, kind: 'zh', key: 'single' },
  { id: 'zh:phrase', title: '双字词语', source: `${ZH_PHRASE.length} 个词语，打整词拼音`, kind: 'zh', key: 'phrase' },
  { id: 'zh:all', title: '全部中文词语', source: '看汉字，打无声调拼音', kind: 'zh', key: 'all' },
]

export function catalogItem(list: GameCatalogItem[], id: string) {
  return list.find((item) => item.id === id) ?? list[0]
}

export function englishWords(item: GameCatalogItem): WordItem[] {
  if (item.kind !== 'en') return []
  if (item.key === 'all') return ALL_WORDS
  return findWordBook(item.key)?.words ?? []
}

export function chineseWords(item: GameCatalogItem): string[] {
  if (item.kind !== 'zh') return []
  if (item.key === 'praise') return ZH_PRAISE
  if (item.key === 'single') return ZH_SINGLE
  if (item.key === 'phrase') return ZH_PHRASE
  return ZH_GAME_WORDS
}

/** 拼音里只保留要打的字母（ü 已由词库转成 v，标点去掉）。 */
export function pinyinLetters(text: string) {
  return text.toLowerCase().replace(/[^a-z]/g, '')
}

let pinyinLoader: Promise<(word: string) => string> | null = null

export function loadWordPinyin() {
  if (!pinyinLoader) {
    pinyinLoader = import('./pinyin').then((mod) => mod.wordToPinyin)
  }
  return pinyinLoader
}

export interface RacePiece {
  id: string
  title: string
  source?: string
  lang: 'en' | 'zh'
  articleId: string
  translation?: string
}

function raceFrom(lang: 'en' | 'zh', categories: readonly { id: string; title: string }[]) {
  const pieces: RacePiece[] = []
  for (const category of categories) {
    for (const article of articlesOfCategory(lang, category.id)) {
      pieces.push({
        id: `${lang}:${article.id}`,
        title: article.title,
        source:
          article.source && article.source !== category.title ? `${category.title} · ${article.source}` : article.source || category.title,
        lang,
        articleId: article.id,
        translation: article.translation,
      })
    }
  }
  return pieces
}

export const RACE_CATALOG: RacePiece[] = [...raceFrom('en', EN_CATEGORIES), ...raceFrom('zh', ZH_CATEGORIES)]

const shortestEnglish = EN_ARTICLES.filter((article) => article.level === 1).sort(
  (a, b) => a.content.length - b.content.length,
)[0]

/** 与原先赛车默认篇相同：最短的一级英文短文。 */
export const DEFAULT_RACE_ID = `en:${shortestEnglish.id}`

export function racePiece(id: string) {
  return RACE_CATALOG.find((item) => item.id === id) ?? RACE_CATALOG.find((item) => item.id === DEFAULT_RACE_ID) ?? RACE_CATALOG[0]
}

/** 英文按原文切词；中文诗词古文按练习页的拼音切分（汉字在上，无声调拼音在下）。 */
export async function raceSegments(piece: RacePiece): Promise<Segment[]> {
  const article = findArticle(piece.lang, piece.articleId)
  if (!article) return []
  if (piece.lang === 'en') return textToEnglishSegments(article.content)
  const { textToPinyinSegments } = await import('./pinyin')
  return textToPinyinSegments(article.content)
}
