import type { Segment } from '@/core/typing-session'

export interface Lesson {
  id: string
  title: string
  desc: string
  /** 本课新学的键 */
  newKeys: string
  /** 本课练习用到的全部字符（含复习） */
  pool: string
  /** 生成多少组 */
  groups?: number
  /** 固定练习内容（优先于随机生成） */
  fixed?: string[]
}

const HOME = 'asdfjkl;'
const TOP = 'qwertyuiop'
const BOTTOM = 'zxcvbnm,./'

export const LESSON_STAGES: { title: string; lessons: Lesson[] }[] = [
  {
    title: '第一关 · 基准键',
    lessons: [
      { id: 'fj', title: 'F 和 J', desc: '摸到小凸点，食指放好', newKeys: 'fj', pool: 'fj' },
      { id: 'dk', title: 'D 和 K', desc: '中指出场', newKeys: 'dk', pool: 'fjdk' },
      { id: 'sl', title: 'S 和 L', desc: '无名指出场', newKeys: 'sl', pool: 'fjdksl' },
      { id: 'a;', title: 'A 和 ;', desc: '小指出场', newKeys: 'a;', pool: HOME },
      { id: 'home', title: '基准键综合', desc: 'ASDF JKL;', newKeys: '', pool: HOME, groups: 16 },
      { id: 'gh', title: 'G 和 H', desc: '食指向中间伸', newKeys: 'gh', pool: HOME + 'gh' },
    ],
  },
  {
    title: '第二关 · 上排键',
    lessons: [
      { id: 'ei', title: 'E 和 I', desc: '中指向上', newKeys: 'ei', pool: HOME + 'ghei' },
      { id: 'ru', title: 'R 和 U', desc: '食指向上', newKeys: 'ru', pool: HOME + 'gheiru' },
      { id: 'ty', title: 'T 和 Y', desc: '食指斜上方', newKeys: 'ty', pool: HOME + 'gheiruty' },
      { id: 'wo', title: 'W 和 O', desc: '无名指向上', newKeys: 'wo', pool: HOME + 'gh' + 'eiru' + 'tywo' },
      { id: 'qp', title: 'Q 和 P', desc: '小指向上', newKeys: 'qp', pool: HOME + 'gh' + TOP },
      { id: 'top', title: '上排综合', desc: 'QWERTYUIOP', newKeys: '', pool: TOP + 'gh' + HOME, groups: 16 },
    ],
  },
  {
    title: '第三关 · 下排键',
    lessons: [
      { id: 'vm', title: 'V 和 M', desc: '食指向下', newKeys: 'vm', pool: HOME + 'vm' },
      { id: 'c,', title: 'C 和 ,', desc: '中指向下', newKeys: 'c,', pool: HOME + 'vmc,' },
      { id: 'x.', title: 'X 和 .', desc: '无名指向下', newKeys: 'x.', pool: HOME + 'vmc,x.' },
      { id: 'z/', title: 'Z 和 /', desc: '小指向下', newKeys: 'z/', pool: HOME + 'vmc,x.z/' },
      { id: 'bn', title: 'B 和 N', desc: '食指斜下方', newKeys: 'bn', pool: HOME + BOTTOM },
      { id: 'bottom', title: '下排综合', desc: 'ZXCVBNM', newKeys: '', pool: BOTTOM + HOME, groups: 16 },
    ],
  },
  {
    title: '第四关 · 进阶',
    lessons: [
      { id: 'all', title: '全部字母', desc: '26 个字母大混战', newKeys: '', pool: 'abcdefghijklmnopqrstuvwxyz', groups: 20 },
      { id: 'num', title: '数字键', desc: '1234567890', newKeys: '1234567890', pool: '1234567890' },
      {
        id: 'shift',
        title: '大写字母',
        desc: '另一只手按 Shift',
        newKeys: '',
        pool: '',
        fixed: ['Aa', 'Bb', 'Cc', 'Dd', 'Ee', 'Ff', 'Gg', 'Hh', 'Ii', 'Jj', 'Kk', 'Ll', 'Mm', 'Nn', 'Oo', 'Pp', 'Qq', 'Rr', 'Ss', 'Tt', 'Uu', 'Vv', 'Ww', 'Xx', 'Yy', 'Zz'],
      },
      {
        id: 'punct',
        title: '常用标点',
        desc: ", . ? ! ' \"",
        newKeys: '',
        pool: '',
        fixed: ['Hi,', 'OK.', 'Yes!', 'Why?', "I'm", "it's", '"Go"', 'a,b', 'c.d', 'e?f', 'g!h'],
      },
    ],
  },
]

export const ALL_LESSONS = LESSON_STAGES.flatMap((s) => s.lessons)

export function findLesson(id: string) {
  return ALL_LESSONS.find((l) => l.id === id)
}

function pick(str: string) {
  return str[Math.floor(Math.random() * str.length)]
}

/** 生成一节课的练习内容：若干组 2~5 个字符，新键出现概率更高 */
export function generateLessonSegments(lesson: Lesson): Segment[] {
  if (lesson.fixed) return lesson.fixed.map((text) => ({ text }))
  const groups = lesson.groups ?? 12
  const list: Segment[] = []
  for (let g = 0; g < groups; g++) {
    const len = 2 + Math.floor(Math.random() * 4)
    let s = ''
    for (let i = 0; i < len; i++) {
      const useNew = lesson.newKeys && Math.random() < 0.6
      s += pick(useNew ? lesson.newKeys : lesson.pool)
    }
    list.push({ text: s })
  }
  return list
}
