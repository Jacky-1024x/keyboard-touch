export interface Article {
  id: string
  title: string
  /** 难度 1~3 */
  level: 1 | 2 | 3
  /** 作者 / 出处 */
  source?: string
  /** 中文翻译（英文文章可选） */
  translation?: string
  content: string
}

export const EN_ARTICLES: Article[] = [
  {
    id: 'my-cat',
    title: 'My Cat',
    level: 1,
    content: 'I have a cat. She is white. She likes to sleep in the sun. I love my cat.',
    translation: '我有一只猫。她是白色的。她喜欢在阳光下睡觉。我爱我的猫。',
  },
  {
    id: 'sunny-day',
    title: 'A Sunny Day',
    level: 1,
    content: 'It is a sunny day. The sky is blue. We go to the park. We run and play. We are happy.',
    translation: '今天是晴天。天空是蓝色的。我们去公园。我们跑啊玩啊。我们很开心。',
  },
  {
    id: 'my-family',
    title: 'My Family',
    level: 2,
    content:
      'There are four people in my family. My father is tall. My mother is kind. My little brother is funny. We eat dinner together every night.',
    translation: '我家有四口人。我爸爸很高。我妈妈很和蔼。我弟弟很有趣。我们每天晚上一起吃晚饭。',
  },
  {
    id: 'lion-mouse',
    title: 'The Lion and the Mouse',
    level: 3,
    source: "Aesop's Fables",
    content:
      'A lion was sleeping. A little mouse ran over his nose. The lion woke up and caught the mouse. "Please let me go," said the mouse. "One day I can help you." The lion laughed and let him go. Some days later, the lion was caught in a net. The mouse came and bit the net. The lion was free. Little friends can be great friends.',
    translation:
      '一头狮子在睡觉。一只小老鼠从他的鼻子上跑过。狮子醒来抓住了老鼠。"请放了我吧，"老鼠说，"有一天我能帮你。"狮子笑了，放走了他。几天后，狮子被网困住了。老鼠跑来咬破了网，狮子自由了。小朋友也能成为好朋友。',
  },
]

export const ZH_ARTICLES: Article[] = [
  { id: 'yong-e', title: '咏鹅', level: 1, source: '唐·骆宾王', content: '鹅，鹅，鹅，\n曲项向天歌。\n白毛浮绿水，\n红掌拨清波。' },
  { id: 'jing-ye-si', title: '静夜思', level: 1, source: '唐·李白', content: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。' },
  { id: 'chun-xiao', title: '春晓', level: 1, source: '唐·孟浩然', content: '春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。' },
  { id: 'min-nong', title: '悯农', level: 1, source: '唐·李绅', content: '锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。' },
  { id: 'deng-guan-que-lou', title: '登鹳雀楼', level: 2, source: '唐·王之涣', content: '白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。' },
  {
    id: 'xiao-mao-diao-yu',
    title: '小猫钓鱼',
    level: 2,
    content:
      '猫妈妈带着小猫在河边钓鱼。一只蜻蜓飞来了，小猫放下鱼竿就去捉蜻蜓。蜻蜓飞走了，小猫空着手回到河边。猫妈妈钓到了一条大鱼。\n小猫明白了：做事要一心一意，不能三心二意。',
  },
]

export function findArticle(lang: 'en' | 'zh', id: string) {
  return (lang === 'en' ? EN_ARTICLES : ZH_ARTICLES).find((a) => a.id === id)
}
