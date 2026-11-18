export interface WordItem {
  en: string
  zh: string
}

export interface WordBook {
  id: string
  title: string
  icon: string
  words: WordItem[]
}

export const WORD_BOOKS: WordBook[] = [
  {
    id: 'animals',
    title: '动物',
    icon: '🐼',
    words: [
      { en: 'cat', zh: '猫' },
      { en: 'dog', zh: '狗' },
      { en: 'pig', zh: '猪' },
      { en: 'duck', zh: '鸭子' },
      { en: 'bird', zh: '鸟' },
      { en: 'fish', zh: '鱼' },
      { en: 'tiger', zh: '老虎' },
      { en: 'panda', zh: '熊猫' },
      { en: 'monkey', zh: '猴子' },
      { en: 'rabbit', zh: '兔子' },
      { en: 'horse', zh: '马' },
      { en: 'elephant', zh: '大象' },
    ],
  },
  {
    id: 'fruits',
    title: '水果',
    icon: '🍎',
    words: [
      { en: 'apple', zh: '苹果' },
      { en: 'pear', zh: '梨' },
      { en: 'peach', zh: '桃子' },
      { en: 'grape', zh: '葡萄' },
      { en: 'lemon', zh: '柠檬' },
      { en: 'mango', zh: '芒果' },
      { en: 'banana', zh: '香蕉' },
      { en: 'orange', zh: '橙子' },
      { en: 'cherry', zh: '樱桃' },
      { en: 'melon', zh: '甜瓜' },
    ],
  },
  {
    id: 'colors',
    title: '颜色',
    icon: '🎨',
    words: [
      { en: 'red', zh: '红色' },
      { en: 'blue', zh: '蓝色' },
      { en: 'green', zh: '绿色' },
      { en: 'yellow', zh: '黄色' },
      { en: 'pink', zh: '粉色' },
      { en: 'black', zh: '黑色' },
      { en: 'white', zh: '白色' },
      { en: 'brown', zh: '棕色' },
      { en: 'purple', zh: '紫色' },
      { en: 'orange', zh: '橙色' },
    ],
  },
  {
    id: 'numbers',
    title: '数字',
    icon: '🔢',
    words: [
      { en: 'one', zh: '一' },
      { en: 'two', zh: '二' },
      { en: 'three', zh: '三' },
      { en: 'four', zh: '四' },
      { en: 'five', zh: '五' },
      { en: 'six', zh: '六' },
      { en: 'seven', zh: '七' },
      { en: 'eight', zh: '八' },
      { en: 'nine', zh: '九' },
      { en: 'ten', zh: '十' },
    ],
  },
  {
    id: 'family',
    title: '家庭',
    icon: '👨‍👩‍👧',
    words: [
      { en: 'father', zh: '爸爸' },
      { en: 'mother', zh: '妈妈' },
      { en: 'brother', zh: '兄弟' },
      { en: 'sister', zh: '姐妹' },
      { en: 'grandpa', zh: '爷爷' },
      { en: 'grandma', zh: '奶奶' },
      { en: 'baby', zh: '宝宝' },
      { en: 'family', zh: '家庭' },
      { en: 'home', zh: '家' },
      { en: 'friend', zh: '朋友' },
    ],
  },
  {
    id: 'school',
    title: '学校',
    icon: '🏫',
    words: [
      { en: 'book', zh: '书' },
      { en: 'pen', zh: '钢笔' },
      { en: 'pencil', zh: '铅笔' },
      { en: 'ruler', zh: '尺子' },
      { en: 'bag', zh: '书包' },
      { en: 'desk', zh: '课桌' },
      { en: 'chair', zh: '椅子' },
      { en: 'teacher', zh: '老师' },
      { en: 'student', zh: '学生' },
      { en: 'class', zh: '班级' },
    ],
  },
  {
    id: 'body',
    title: '身体',
    icon: '🖐️',
    words: [
      { en: 'head', zh: '头' },
      { en: 'face', zh: '脸' },
      { en: 'eye', zh: '眼睛' },
      { en: 'ear', zh: '耳朵' },
      { en: 'nose', zh: '鼻子' },
      { en: 'mouth', zh: '嘴巴' },
      { en: 'hand', zh: '手' },
      { en: 'arm', zh: '胳膊' },
      { en: 'leg', zh: '腿' },
      { en: 'foot', zh: '脚' },
    ],
  },
  {
    id: 'food',
    title: '食物',
    icon: '🍚',
    words: [
      { en: 'rice', zh: '米饭' },
      { en: 'bread', zh: '面包' },
      { en: 'egg', zh: '鸡蛋' },
      { en: 'milk', zh: '牛奶' },
      { en: 'water', zh: '水' },
      { en: 'juice', zh: '果汁' },
      { en: 'cake', zh: '蛋糕' },
      { en: 'noodles', zh: '面条' },
      { en: 'meat', zh: '肉' },
      { en: 'candy', zh: '糖果' },
    ],
  },
]

export function findWordBook(id: string) {
  return WORD_BOOKS.find((b) => b.id === id)
}

export const ALL_WORDS: WordItem[] = WORD_BOOKS.flatMap((b) => b.words)
