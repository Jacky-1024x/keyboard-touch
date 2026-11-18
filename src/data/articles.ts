export type ZhCategoryId = 'tang' | 'song' | 'classic' | 'school'
export type EnCategoryId = 'fable' | 'rhyme' | 'story'

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
  /** 所属分类 */
  category: ZhCategoryId | EnCategoryId
}

export interface ArticleCategory<T extends string = string> {
  id: T
  title: string
  icon: string
  desc: string
}

export const ZH_CATEGORIES: ArticleCategory<ZhCategoryId>[] = [
  { id: 'tang', title: '唐诗', icon: '📜', desc: '小学生必背古诗' },
  { id: 'song', title: '宋诗宋词', icon: '🎐', desc: '宋元明清名篇' },
  { id: 'classic', title: '古文', icon: '📖', desc: '三字经 · 百家姓 · 千字文 · 弟子规' },
  { id: 'school', title: '小学课文', icon: '🏫', desc: '普通课文与小古文' },
]

export const EN_CATEGORIES: ArticleCategory<EnCategoryId>[] = [
  { id: 'fable', title: "Aesop's Fables", icon: '🦁', desc: '伊索寓言' },
  { id: 'rhyme', title: 'Nursery Rhymes', icon: '🎵', desc: '经典童谣' },
  { id: 'story', title: 'Short Stories', icon: '📘', desc: '简易短文' },
]

export const ZH_ARTICLES: Article[] = [
  // ——— 唐诗 ———
  { id: 'yong-e', title: '咏鹅', level: 1, source: '唐·骆宾王', category: 'tang', content: '鹅，鹅，鹅，\n曲项向天歌。\n白毛浮绿水，\n红掌拨清波。' },
  { id: 'jing-ye-si', title: '静夜思', level: 1, source: '唐·李白', category: 'tang', content: '床前明月光，\n疑是地上霜。\n举头望明月，\n低头思故乡。' },
  { id: 'chun-xiao', title: '春晓', level: 1, source: '唐·孟浩然', category: 'tang', content: '春眠不觉晓，\n处处闻啼鸟。\n夜来风雨声，\n花落知多少。' },
  { id: 'min-nong-1', title: '悯农（其一）', level: 1, source: '唐·李绅', category: 'tang', content: '锄禾日当午，\n汗滴禾下土。\n谁知盘中餐，\n粒粒皆辛苦。' },
  { id: 'min-nong-2', title: '悯农（其二）', level: 1, source: '唐·李绅', category: 'tang', content: '春种一粒粟，\n秋收万颗子。\n四海无闲田，\n农夫犹饿死。' },
  { id: 'deng-guan-que-lou', title: '登鹳雀楼', level: 1, source: '唐·王之涣', category: 'tang', content: '白日依山尽，\n黄河入海流。\n欲穷千里目，\n更上一层楼。' },
  { id: 'ye-si', title: '夜思', level: 1, source: '唐·李白', category: 'tang', content: '床前看月光，\n疑是地上霜。\n举头望山月，\n低头思故乡。' },
  { id: 'xiang-si', title: '相思', level: 2, source: '唐·王维', category: 'tang', content: '红豆生南国，\n春来发几枝。\n愿君多采撷，\n此物最相思。' },
  { id: 'za-shi', title: '杂诗', level: 2, source: '唐·王维', category: 'tang', content: '君自故乡来，\n应知故乡事。\n来日绮窗前，\n寒梅著花未？' },
  { id: 'zhu-zhi-ci', title: '竹枝词', level: 2, source: '唐·刘禹锡', category: 'tang', content: '杨柳青青江水平，\n闻郎江上唱歌声。\n东边日出西边雨，\n道是无晴却有晴。' },
  { id: 'wang-lu-shan-pu-bu', title: '望庐山瀑布', level: 2, source: '唐·李白', category: 'tang', content: '日照香炉生紫烟，\n遥看瀑布挂前川。\n飞流直下三千尺，\n疑是银河落九天。' },
  { id: 'zeng-wang-lun', title: '赠汪伦', level: 1, source: '唐·李白', category: 'tang', content: '李白乘舟将欲行，\n忽闻岸上踏歌声。\n桃花潭水深千尺，\n不及汪伦送我情。' },
  { id: 'huang-he-lou-song-meng-hao-ran', title: '黄鹤楼送孟浩然之广陵', level: 2, source: '唐·李白', category: 'tang', content: '故人西辞黄鹤楼，\n烟花三月下扬州。\n孤帆远影碧空尽，\n唯见长江天际流。' },
  { id: 'wang-tian-men-shan', title: '望天门山', level: 2, source: '唐·李白', category: 'tang', content: '天门中断楚江开，\n碧水东流至此回。\n两岸青山相对出，\n孤帆一片日边来。' },
  { id: 'zao-fa-bai-di-cheng', title: '早发白帝城', level: 2, source: '唐·李白', category: 'tang', content: '朝辞白帝彩云间，\n千里江陵一日还。\n两岸猿声啼不住，\n轻舟已过万重山。' },
  { id: 'jue-ju-du-fu', title: '绝句', level: 1, source: '唐·杜甫', category: 'tang', content: '两个黄鹂鸣翠柳，\n一行白鹭上青天。\n窗含西岭千秋雪，\n门泊东吴万里船。' },
  { id: 'chun-ye-xi-yu', title: '春夜喜雨', level: 2, source: '唐·杜甫', category: 'tang', content: '好雨知时节，\n当春乃发生。\n随风潜入夜，\n润物细无声。' },
  { id: 'jiang-xue', title: '江雪', level: 2, source: '唐·柳宗元', category: 'tang', content: '千山鸟飞绝，\n万径人踪灭。\n孤舟蓑笠翁，\n独钓寒江雪。' },
  { id: 'feng-qiao-ye-bo', title: '枫桥夜泊', level: 2, source: '唐·张继', category: 'tang', content: '月落乌啼霜满天，\n江枫渔火对愁眠。\n姑苏城外寒山寺，\n夜半钟声到客船。' },
  { id: 'you-zi-yin', title: '游子吟', level: 1, source: '唐·孟郊', category: 'tang', content: '慈母手中线，\n游子身上衣。\n临行密密缝，\n意恐迟迟归。\n谁言寸草心，\n报得三春晖。' },
  { id: 'xiao-er', title: '小儿垂钓', level: 1, source: '唐·胡令能', category: 'tang', content: '蓬头稚子学垂纶，\n侧坐莓苔草映身。\n路人借问遥招手，\n怕得鱼惊不应人。' },
  { id: 'hui-xiang-ou-shu', title: '回乡偶书', level: 2, source: '唐·贺知章', category: 'tang', content: '少小离家老大回，\n乡音无改鬓毛衰。\n儿童相见不相识，\n笑问客从何处来。' },
  { id: 'yong-liu', title: '咏柳', level: 1, source: '唐·贺知章', category: 'tang', content: '碧玉妆成一树高，\n万条垂下绿丝绦。\n不知细叶谁裁出，\n二月春风似剪刀。' },
  { id: 'liang-zhou-ci', title: '凉州词', level: 2, source: '唐·王之涣', category: 'tang', content: '黄河远上白云间，\n一片孤城万仞山。\n羌笛何须怨杨柳，\n春风不度玉门关。' },
  { id: 'chu-sai', title: '出塞', level: 2, source: '唐·王昌龄', category: 'tang', content: '秦时明月汉时关，\n万里长征人未还。\n但使龙城飞将在，\n不教胡马度阴山。' },
  { id: 'fu-rong-lou', title: '芙蓉楼送辛渐', level: 2, source: '唐·王昌龄', category: 'tang', content: '寒雨连江夜入吴，\n平明送客楚山孤。\n洛阳亲友如相问，\n一片冰心在玉壶。' },
  { id: 'qiuye', title: '山行', level: 1, source: '唐·杜牧', category: 'tang', content: '远上寒山石径斜，\n白云生处有人家。\n停车坐爱枫林晚，\n霜叶红于二月花。' },
  { id: 'qing-ming', title: '清明', level: 1, source: '唐·杜牧', category: 'tang', content: '清明时节雨纷纷，\n路上行人欲断魂。\n借问酒家何处有，\n牧童遥指杏花村。' },
  { id: 'le-you-yuan', title: '乐游原', level: 2, source: '唐·李商隐', category: 'tang', content: '向晚意不适，\n驱车登古原。\n夕阳无限好，\n只是近黄昏。' },
  { id: 'feng', title: '风', level: 1, source: '唐·李峤', category: 'tang', content: '解落三秋叶，\n能开二月花。\n过江千尺浪，\n入竹万竿斜。' },

  // ——— 宋词 ———
  {
    id: 'ru-meng-ling',
    title: '如梦令',
    level: 2,
    source: '宋·李清照',
    category: 'song',
    content: '常记溪亭日暮，\n沉醉不知归路。\n兴尽晚回舟，\n误入藕花深处。\n争渡，争渡，\n惊起一滩鸥鹭。',
  },
  {
    id: 'yu-mei-ren',
    title: '虞美人',
    level: 3,
    source: '南唐·李煜',
    category: 'song',
    content: '春花秋月何时了？\n往事知多少。\n小楼昨夜又东风，\n故国不堪回首月明中。\n雕栏玉砌应犹在，\n只是朱颜改。\n问君能有几多愁？\n恰似一江春水向东流。',
  },
  {
    id: 'shui-diao-ge-tou',
    title: '水调歌头',
    level: 3,
    source: '宋·苏轼',
    category: 'song',
    content: '明月几时有？\n把酒问青天。\n不知天上宫阙，\n今夕是何年。\n我欲乘风归去，\n又恐琼楼玉宇，\n高处不胜寒。\n起舞弄清影，\n何似在人间。',
  },
  {
    id: 'ti-xi-lin-bi',
    title: '题西林壁',
    level: 2,
    source: '宋·苏轼',
    category: 'song',
    content: '横看成岭侧成峰，\n远近高低各不同。\n不识庐山真面目，\n只缘身在此山中。',
  },
  {
    id: 'hui-chong-chun-jiang',
    title: '惠崇春江晚景',
    level: 1,
    source: '宋·苏轼',
    category: 'song',
    content: '竹外桃花三两枝，\n春江水暖鸭先知。\n蒌蒿满地芦芽短，\n正是河豚欲上时。',
  },
  {
    id: 'xiao-chi',
    title: '小池',
    level: 1,
    source: '宋·杨万里',
    category: 'song',
    content: '泉眼无声惜细流，\n树阴照水爱晴柔。\n小荷才露尖尖角，\n早有蜻蜓立上头。',
  },
  {
    id: 'xiao-chu',
    title: '晓出净慈寺送林子方',
    level: 2,
    source: '宋·杨万里',
    category: 'song',
    content: '毕竟西湖六月中，\n风光不与四时同。\n接天莲叶无穷碧，\n映日荷花别样红。',
  },
  {
    id: 'you-yuan-bu-zhi',
    title: '游园不值',
    level: 2,
    source: '宋·叶绍翁',
    category: 'song',
    content: '应怜屐齿印苍苔，\n小扣柴扉久不开。\n春色满园关不住，\n一枝红杏出墙来。',
  },
  {
    id: 'cun-ju',
    title: '村居',
    level: 1,
    source: '清·高鼎',
    category: 'song',
    content: '草长莺飞二月天，\n拂堤杨柳醉春烟。\n儿童散学归来早，\n忙趁东风放纸鸢。',
  },
  {
    id: 'suo-chuang',
    title: '所见',
    level: 1,
    source: '清·袁枚',
    category: 'song',
    content: '牧童骑黄牛，\n歌声振林樾。\n意欲捕鸣蝉，\n忽然闭口立。',
  },
  {
    id: 'yin-hu-shang-chu-qing',
    title: '饮湖上初晴后雨',
    level: 2,
    source: '宋·苏轼',
    category: 'song',
    content: '水光潋滟晴方好，\n山色空蒙雨亦奇。\n欲把西湖比西子，\n淡妆浓抹总相宜。',
  },
  {
    id: 'mei-hua',
    title: '梅花',
    level: 1,
    source: '宋·王安石',
    category: 'song',
    content: '墙角数枝梅，\n凌寒独自开。\n遥知不是雪，\n为有暗香来。',
  },
  {
    id: 'yuan-ri',
    title: '元日',
    level: 1,
    source: '宋·王安石',
    category: 'song',
    content: '爆竹声中一岁除，\n春风送暖入屠苏。\n千门万户曈曈日，\n总把新桃换旧符。',
  },
  {
    id: 'bo-chuan-gua-zhou',
    title: '泊船瓜洲',
    level: 2,
    source: '宋·王安石',
    category: 'song',
    content: '京口瓜洲一水间，\n钟山只隔数重山。\n春风又绿江南岸，\n明月何时照我还？',
  },
  {
    id: 'xia-ri-jue-ju',
    title: '夏日绝句',
    level: 2,
    source: '宋·李清照',
    category: 'song',
    content: '生当作人杰，\n死亦为鬼雄。\n至今思项羽，\n不肯过江东。',
  },
  {
    id: 'shi-er',
    title: '示儿',
    level: 2,
    source: '宋·陆游',
    category: 'song',
    content: '死去元知万事空，\n但悲不见九州同。\n王师北定中原日，\n家祭无忘告乃翁。',
  },
  {
    id: 'qiu-ye-jiang-xiao-chu-li-men',
    title: '秋夜将晓出篱门迎凉有感',
    level: 2,
    source: '宋·陆游',
    category: 'song',
    content: '三万里河东入海，\n五千仞岳上摩天。\n遗民泪尽胡尘里，\n南望王师又一年。',
  },
  {
    id: 'si-shi-tian-yuan',
    title: '四时田园杂兴',
    level: 1,
    source: '宋·范成大',
    category: 'song',
    content: '昼出耘田夜绩麻，\n村庄儿女各当家。\n童孙未解供耕织，\n也傍桑阴学种瓜。',
  },

  // ——— 古文（分章，便于练习） ———
  {
    id: 'san-zi-jing-1',
    title: '三字经（一）',
    level: 1,
    source: '传统蒙学',
    category: 'classic',
    content: '人之初，性本善。\n性相近，习相远。\n苟不教，性乃迁。\n教之道，贵以专。\n昔孟母，择邻处。\n子不学，断机杼。\n窦燕山，有义方。\n教五子，名俱扬。',
  },
  {
    id: 'san-zi-jing-2',
    title: '三字经（二）',
    level: 1,
    source: '传统蒙学',
    category: 'classic',
    content: '养不教，父之过。\n教不严，师之惰。\n子不学，非所宜。\n幼不学，老何为。\n玉不琢，不成器。\n人不学，不知义。\n为人子，方少时。\n亲师友，习礼仪。',
  },
  {
    id: 'san-zi-jing-3',
    title: '三字经（三）',
    level: 2,
    source: '传统蒙学',
    category: 'classic',
    content: '香九龄，能温席。\n孝于亲，所当执。\n融四岁，能让梨。\n弟于长，宜先知。\n首孝悌，次见闻。\n知某数，识某文。\n一而十，十而百。\n百而千，千而万。',
  },
  {
    id: 'bai-jia-xing-1',
    title: '百家姓（一）',
    level: 1,
    source: '传统蒙学',
    category: 'classic',
    content: '赵钱孙李，\n周吴郑王。\n冯陈褚卫，\n蒋沈韩杨。\n朱秦尤许，\n何吕施张。\n孔曹严华，\n金魏陶姜。',
  },
  {
    id: 'bai-jia-xing-2',
    title: '百家姓（二）',
    level: 1,
    source: '传统蒙学',
    category: 'classic',
    content: '戚谢邹喻，\n柏水窦章。\n云苏潘葛，\n奚范彭郎。\n鲁韦昌马，\n苗凤花方。\n俞任袁柳，\n酆鲍史唐。',
  },
  {
    id: 'bai-jia-xing-3',
    title: '百家姓（三）',
    level: 2,
    source: '传统蒙学',
    category: 'classic',
    content: '费廉岑薛，\n雷贺倪汤。\n滕殷罗毕，\n郝邬安常。\n乐于时傅，\n皮卞齐康。\n伍余元卜，\n顾孟平黄。',
  },
  {
    id: 'qian-zi-wen-1',
    title: '千字文（一）',
    level: 2,
    source: '梁·周兴嗣',
    category: 'classic',
    content: '天地玄黄，宇宙洪荒。\n日月盈昃，辰宿列张。\n寒来暑往，秋收冬藏。\n闰余成岁，律吕调阳。\n云腾致雨，露结为霜。\n金生丽水，玉出昆冈。',
  },
  {
    id: 'qian-zi-wen-2',
    title: '千字文（二）',
    level: 2,
    source: '梁·周兴嗣',
    category: 'classic',
    content: '剑号巨阙，珠称夜光。\n果珍李柰，菜重芥姜。\n海咸河淡，鳞潜羽翔。\n龙师火帝，鸟官人皇。\n始制文字，乃服衣裳。\n推位让国，有虞陶唐。',
  },
  {
    id: 'qian-zi-wen-3',
    title: '千字文（三）',
    level: 3,
    source: '梁·周兴嗣',
    category: 'classic',
    content: '吊民伐罪，周发殷汤。\n坐朝问道，垂拱平章。\n爱育黎首，臣伏戎羌。\n遐迩一体，率宾归王。\n鸣凤在竹，白驹食场。\n化被草木，赖及万方。',
  },
  {
    id: 'di-zi-gui-1',
    title: '弟子规（总叙·入则孝）',
    level: 1,
    source: '清·李毓秀',
    category: 'classic',
    content: '弟子规，圣人训。\n首孝悌，次谨信。\n泛爱众，而亲仁。\n有余力，则学文。\n父母呼，应勿缓。\n父母命，行勿懒。\n父母教，须敬听。\n父母责，须顺承。',
  },
  {
    id: 'di-zi-gui-2',
    title: '弟子规（出则弟）',
    level: 2,
    source: '清·李毓秀',
    category: 'classic',
    content: '兄道友，弟道恭。\n兄弟睦，孝在中。\n财物轻，怨何生。\n言语忍，忿自泯。\n或饮食，或坐走。\n长者先，幼者后。\n长呼人，即代叫。\n人不在，己即到。',
  },
  {
    id: 'di-zi-gui-3',
    title: '弟子规（谨）',
    level: 2,
    source: '清·李毓秀',
    category: 'classic',
    content: '朝起早，夜眠迟。\n老易至，惜此时。\n晨必盥，兼漱口。\n便溺回，辄净手。\n冠必正，纽必结。\n袜与履，俱紧切。\n置冠服，有定位。\n勿乱顿，致污秽。',
  },

  // ——— 小学课文 ———
  {
    id: 'xiao-mao-diao-yu',
    title: '小猫钓鱼',
    level: 1,
    source: '小学课文',
    category: 'school',
    content:
      '猫妈妈带着小猫在河边钓鱼。一只蜻蜓飞来了，小猫放下鱼竿就去捉蜻蜓。蜻蜓飞走了，小猫空着手回到河边。猫妈妈钓到了一条大鱼。\n小猫明白了：做事要一心一意，不能三心二意。',
  },
  {
    id: 'wu-ya-he-shui',
    title: '乌鸦喝水',
    level: 1,
    source: '小学课文',
    category: 'school',
    content:
      '一只乌鸦口渴了，到处找水喝。乌鸦看见一个瓶子，瓶子里有水。可是瓶子很高，瓶口很小，里边的水又少，它喝不着。\n怎么办呢？乌鸦看见旁边有许多小石子，它想出办法来了。乌鸦把小石子一个一个地放进瓶子里。瓶子里的水渐渐升高，乌鸦就喝着水了。',
  },
  {
    id: 'xiao-gou-kan-jia',
    title: '小狗看家',
    level: 1,
    source: '小学课文',
    category: 'school',
    content:
      '小狗在家里看家。小猫走过来，小狗对它叫。小鸭走过来，小狗对它叫。小鸡走过来，小狗对它叫。\n主人回来了，小狗摇摇尾巴，高兴地叫起来。',
  },
  {
    id: 'hua',
    title: '画',
    level: 1,
    source: '小学课文',
    category: 'school',
    content: '远看山有色，\n近听水无声。\n春去花还在，\n人来鸟不惊。',
  },
  {
    id: 'cao',
    title: '草',
    level: 1,
    source: '唐·白居易',
    category: 'school',
    content: '离离原上草，\n一岁一枯荣。\n野火烧不尽，\n春风吹又生。',
  },
  {
    id: 'chun-yu',
    title: '春雨',
    level: 1,
    source: '小学课文',
    category: 'school',
    content: '好雨知时节，\n当春乃发生。\n随风潜入夜，\n润物细无声。',
  },
  {
    id: 'da-hai-de-ge',
    title: '大海的歌',
    level: 2,
    source: '小学课文',
    category: 'school',
    content:
      '早晨，太阳刚升起，我来到海边。大海又蓝又宽。海面上闪着点点金光。远处，海天相接，白帆点点。\n大海啊，你唱着欢乐的歌，欢迎我们。',
  },
  {
    id: 'shui-kong-qi',
    title: '植物妈妈有办法',
    level: 2,
    source: '小学课文',
    category: 'school',
    content:
      '孩子如果已经长大，就得告别妈妈，四海为家。牛马有脚，鸟有翅膀，植物旅行又用什么办法？\n蒲公英的种子，飞呀飞；苍耳的种子，挂住动物的皮毛；豌豆的荚果炸开，种子蹦到远处。植物妈妈真有办法！',
  },
  {
    id: 'shou-zhu-dai-tu',
    title: '守株待兔',
    level: 2,
    source: '《韩非子》',
    category: 'school',
    content:
      '宋人有耕者。田中有株。兔走触株，折颈而死。因释其耒而守株，冀复得兔。兔不可复得，而身为宋国笑。',
  },
  {
    id: 'ke-zhou-qiu-jian',
    title: '刻舟求剑',
    level: 2,
    source: '《吕氏春秋》',
    category: 'school',
    content:
      '楚人有涉江者，其剑自舟中坠于水，遽契其舟，曰：“是吾剑之所从坠。”舟止，从其所契者入水求之。舟已行矣，而剑不行，求剑若此，不亦惑乎？',
  },
  {
    id: 'hu-jia-hu-wei',
    title: '狐假虎威',
    level: 2,
    source: '《战国策》',
    category: 'school',
    content:
      '虎求百兽而食之，得狐。狐曰：“子无敢食我也！天帝使我长百兽。今子食我，是逆天帝命也。子以我为不信，吾为子先行，子随我后，观百兽之见我而敢不走乎？”虎以为然，故遂与之行。兽见之皆走。虎不知兽畏己而走也，以为畏狐也。',
  },
  {
    id: 'wang-yang-bu-lao',
    title: '亡羊补牢',
    level: 2,
    source: '《战国策》',
    category: 'school',
    content:
      '今有一人，亡羊而不补牢。明日又亡一羊。邻人劝之曰：“速补牢。”其人不应。他日又亡羊，乃大悔，急补之。羊不再亡。',
  },
  {
    id: 'ba-miao-zhu-zhang',
    title: '拔苗助长',
    level: 2,
    source: '《孟子》',
    category: 'school',
    content:
      '宋人有闵其苗之不长而揠之者，芒芒然归，谓其人曰：“今日病矣，予助苗长矣。”其子趋而往视之，苗则槁矣。',
  },
  {
    id: 'sai-weng-shi-ma',
    title: '塞翁失马',
    level: 3,
    source: '《淮南子》',
    category: 'school',
    content:
      '近塞上之人有善术者，马无故亡而入胡。人皆吊之。其父曰：“此何遽不为福乎？”居数月，其马将胡骏马而归。人皆贺之。其父曰：“此何遽不能为祸乎？”家富良马，其子好骑，堕而折其髀。人皆吊之。其父曰：“此何遽不为福乎？”居一年，胡人大入塞，丁壮者引弦而战，近塞之人，死者十九。此独以跛之故，父子相保。',
  },
  {
    id: 'yu-gong-yi-shan',
    title: '愚公移山（节选）',
    level: 3,
    source: '《列子》',
    category: 'school',
    content:
      '太行、王屋二山，方七百里，高万仞。北山愚公者，年且九十，面山而居。惩山北之塞，出入之迂也，聚室而谋曰：“吾与汝毕力平险，指通豫南，达于汉阴，可乎？”杂然相许。',
  },
  {
    id: 'liang-xiao-er-bian-ri',
    title: '两小儿辩日',
    level: 3,
    source: '《列子》',
    category: 'school',
    content:
      '孔子东游，见两小儿辩斗，问其故。一儿曰：“我以日始出时去人近，而日中时远也。”一儿曰：“我以日初出远，而日中时近也。”一儿曰：“日初出大如车盖，及日中则如盘盂，此不为远者小而近者大乎？”一儿曰：“日初出沧沧凉凉，及其日中如探汤，此不为近者热而远者凉乎？”孔子不能决也。两小儿笑曰：“孰为汝多知乎？”',
  },
]

export const EN_ARTICLES: Article[] = [
  // ——— Aesop ———
  {
    id: 'lion-mouse',
    title: 'The Lion and the Mouse',
    level: 2,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A lion was sleeping. A little mouse ran over his nose. The lion woke up and caught the mouse. "Please let me go," said the mouse. "One day I can help you." The lion laughed and let him go. Some days later, the lion was caught in a net. The mouse came and bit the net. The lion was free. Little friends can be great friends.',
    translation:
      '一头狮子在睡觉。一只小老鼠从他的鼻子上跑过。狮子醒来抓住了老鼠。"请放了我吧，"老鼠说，"有一天我能帮你。"狮子笑了，放走了他。几天后，狮子被网困住了。老鼠跑来咬破了网，狮子自由了。小朋友也能成为好朋友。',
  },
  {
    id: 'hare-tortoise',
    title: 'The Hare and the Tortoise',
    level: 2,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A hare laughed at a tortoise. "You are so slow!" he said. The tortoise said, "Let us race." The hare ran fast and then slept under a tree. The tortoise walked and walked. When the hare woke up, the tortoise was near the end. The tortoise won. Slow and steady wins the race.',
    translation:
      '兔子嘲笑乌龟：“你太慢了！”乌龟说：“我们赛跑吧。”兔子跑得很快，然后在树下睡着了。乌龟一步一步往前走。兔子醒来时，乌龟已经快到终点了。乌龟赢了。坚持到底就能胜利。',
  },
  {
    id: 'fox-grapes',
    title: 'The Fox and the Grapes',
    level: 1,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A fox saw some grapes high on a vine. He jumped and jumped, but he could not reach them. At last he walked away. "Those grapes are sour," he said. It is easy to hate what you cannot have.',
    translation: '狐狸看见藤上挂着葡萄。他跳啊跳，却够不着。最后他走开了，说：“那些葡萄是酸的。”得不到的东西，就说它不好，这很容易。',
  },
  {
    id: 'ant-grasshopper',
    title: 'The Ant and the Grasshopper',
    level: 2,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'In summer, an ant worked hard and saved food. A grasshopper sang and danced every day. When winter came, the grasshopper had no food. He asked the ant for help. The ant said, "You sang in summer. Now you can dance in winter." Work today for a better tomorrow.',
    translation:
      '夏天，蚂蚁努力干活存粮食。蚱蜢每天唱歌跳舞。冬天来了，蚱蜢没有吃的，去向蚂蚁求助。蚂蚁说：“你夏天唱歌，现在可以跳舞了。”今天努力，明天才会更好。',
  },
  {
    id: 'boy-wolf',
    title: 'The Boy Who Cried Wolf',
    level: 2,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A boy watched sheep near a village. He cried, "Wolf! Wolf!" The people ran to help, but there was no wolf. The boy laughed. He did it again. One day a real wolf came. The boy cried for help, but no one came. No one believes a liar.',
    translation:
      '一个男孩在村边放羊。他喊：“狼来了！狼来了！”人们跑来帮忙，却没有狼。男孩笑了。他又喊了一次。后来真的来了一只狼。男孩再喊救命，却没有人来。没有人相信说谎的人。',
  },
  {
    id: 'dog-shadow',
    title: 'The Dog and His Reflection',
    level: 1,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A dog had a piece of meat. He crossed a bridge and saw his reflection in the water. He thought it was another dog with bigger meat. He barked to get it, and his own meat fell into the river. Be happy with what you have.',
    translation: '狗嘴里叼着肉。它过桥时看见水里的影子，以为是另一只狗叼着更大的肉。它一叫，自己的肉掉进了河里。要珍惜自己已有的东西。',
  },
  {
    id: 'crow-pitcher',
    title: 'The Crow and the Pitcher',
    level: 1,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'A thirsty crow found a pitcher with a little water at the bottom. His beak could not reach it. He dropped pebbles into the pitcher one by one. The water rose, and the crow drank. Where there is a will, there is a way.',
    translation: '口渴的乌鸦找到一只瓶子，底部只有一点水，嘴够不着。它把小石子一颗颗丢进去，水面升高了，乌鸦喝到了水。有志者事竟成。',
  },
  {
    id: 'wind-sun',
    title: 'The Wind and the Sun',
    level: 2,
    source: "Aesop's Fables",
    category: 'fable',
    content:
      'The wind and the sun argued about who was stronger. They saw a man with a coat. The wind blew hard, but the man held his coat tight. Then the sun shone warmly. The man took off his coat. Kindness is stronger than force.',
    translation: '风和太阳争论谁更强。他们看见一个穿大衣的人。风猛吹，人却把大衣裹得更紧。太阳温暖地照着，人脱掉了大衣。温柔比强力更有力量。',
  },

  // ——— Nursery Rhymes ———
  {
    id: 'twinkle',
    title: 'Twinkle, Twinkle, Little Star',
    level: 1,
    source: 'Jane Taylor',
    category: 'rhyme',
    content:
      'Twinkle, twinkle, little star,\nHow I wonder what you are!\nUp above the world so high,\nLike a diamond in the sky.',
    translation: '一闪一闪亮晶晶，满天都是小星星。挂在天上放光明，好像许多小眼睛。',
  },
  {
    id: 'humpty',
    title: 'Humpty Dumpty',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content:
      'Humpty Dumpty sat on a wall.\nHumpty Dumpty had a great fall.\nAll the king\'s horses and all the king\'s men\nCould not put Humpty together again.',
  },
  {
    id: 'jack-jill',
    title: 'Jack and Jill',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content:
      'Jack and Jill went up the hill\nTo fetch a pail of water.\nJack fell down and broke his crown,\nAnd Jill came tumbling after.',
  },
  {
    id: 'baa-baa',
    title: 'Baa, Baa, Black Sheep',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content:
      'Baa, baa, black sheep, have you any wool?\nYes sir, yes sir, three bags full.\nOne for the master, one for the dame,\nAnd one for the little boy who lives down the lane.',
  },
  {
    id: 'mary-lamb',
    title: 'Mary Had a Little Lamb',
    level: 1,
    source: 'Sarah Josepha Hale',
    category: 'rhyme',
    content:
      'Mary had a little lamb,\nIts fleece was white as snow.\nAnd everywhere that Mary went,\nThe lamb was sure to go.',
  },
  {
    id: 'row-boat',
    title: 'Row, Row, Row Your Boat',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content:
      'Row, row, row your boat,\nGently down the stream.\nMerrily, merrily, merrily, merrily,\nLife is but a dream.',
  },
  {
    id: 'rain-rain',
    title: 'Rain, Rain, Go Away',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content: 'Rain, rain, go away.\nCome again another day.\nLittle children want to play.\nRain, rain, go away.',
  },
  {
    id: 'itsy-spider',
    title: 'The Itsy Bitsy Spider',
    level: 1,
    source: 'Nursery Rhyme',
    category: 'rhyme',
    content:
      'The itsy bitsy spider climbed up the water spout.\nDown came the rain and washed the spider out.\nOut came the sun and dried up all the rain.\nAnd the itsy bitsy spider climbed up the spout again.',
  },

  // ——— Short Stories ———
  {
    id: 'my-cat',
    title: 'My Cat',
    level: 1,
    source: 'Short Story',
    category: 'story',
    content: 'I have a cat. She is white. She likes to sleep in the sun. I love my cat.',
    translation: '我有一只猫。她是白色的。她喜欢在阳光下睡觉。我爱我的猫。',
  },
  {
    id: 'sunny-day',
    title: 'A Sunny Day',
    level: 1,
    source: 'Short Story',
    category: 'story',
    content: 'It is a sunny day. The sky is blue. We go to the park. We run and play. We are happy.',
    translation: '今天是晴天。天空是蓝色的。我们去公园。我们跑啊玩啊。我们很开心。',
  },
  {
    id: 'my-family',
    title: 'My Family',
    level: 1,
    source: 'Short Story',
    category: 'story',
    content:
      'There are four people in my family. My father is tall. My mother is kind. My little brother is funny. We eat dinner together every night.',
    translation: '我家有四口人。我爸爸很高。我妈妈很和蔼。我弟弟很有趣。我们每天晚上一起吃晚饭。',
  },
  {
    id: 'school-day',
    title: 'A Day at School',
    level: 1,
    source: 'Short Story',
    category: 'story',
    content:
      'I go to school every morning. I read books and write stories. At noon I eat lunch with my friends. In the afternoon we play games. I love my school.',
    translation: '我每天早上去上学。我读书、写故事。中午和朋友一起吃午饭。下午我们玩游戏。我爱我的学校。',
  },
  {
    id: 'lost-puppy',
    title: 'The Lost Puppy',
    level: 2,
    source: 'Short Story',
    category: 'story',
    content:
      'Tom found a little puppy in the rain. The puppy was cold and wet. Tom took it home and gave it milk. The next day a girl came. "This is my puppy!" she said. Tom was sad but happy. He helped a friend find her pet.',
    translation:
      '汤姆在雨中发现一只小狗。小狗又冷又湿。汤姆把它带回家，给它牛奶喝。第二天一个女孩来了，说：“这是我的小狗！”汤姆有点难过，但又很高兴。他帮助朋友找到了宠物。',
  },
  {
    id: 'magic-seed',
    title: 'The Magic Seed',
    level: 2,
    source: 'Short Story',
    category: 'story',
    content:
      'Lily planted a small seed in the garden. Every day she watered it. One morning a green sprout came out. Then a flower bloomed. "Wow!" said Lily. "Hard work can make magic."',
    translation: '莉莉在花园里种下一颗小种子。她每天浇水。一天早上冒出了绿芽，然后开出了花。莉莉说：“哇！努力可以创造奇迹。”',
  },
  {
    id: 'two-friends',
    title: 'Two Friends',
    level: 2,
    source: 'Short Story',
    category: 'story',
    content:
      'Anna and Ben were best friends. One day Anna fell and hurt her knee. Ben helped her stand up and took her home. Anna smiled. "A true friend helps you when you need it," she said.',
    translation: '安娜和本是最好的朋友。有一天安娜摔倒，膝盖受伤了。本扶她起来，送她回家。安娜笑着说：“真正的朋友会在你需要时帮助你。”',
  },
  {
    id: 'little-red',
    title: 'Little Red Riding Hood',
    level: 3,
    source: 'Fairy Tale',
    category: 'story',
    content:
      'Little Red Riding Hood went to see her grandma. She met a wolf in the woods. The wolf ran to grandma\'s house first. When the girl arrived, she saw big eyes and big teeth. "Help!" she cried. A hunter came and saved them. Do not talk to strangers.',
    translation:
      '小红帽去看望奶奶。她在树林里遇见了狼。狼先跑到奶奶家。小红帽到了，看见大大的眼睛和大大的牙齿。她大喊救命。猎人赶来救了她们。不要和陌生人说话。',
  },
  {
    id: 'three-pigs',
    title: 'The Three Little Pigs',
    level: 3,
    source: 'Fairy Tale',
    category: 'story',
    content:
      'Three little pigs built three houses: one of straw, one of sticks, and one of bricks. A wolf blew down the first two houses. But he could not blow down the brick house. The pigs were safe. Hard work keeps you safe.',
    translation:
      '三只小猪盖了三座房子：稻草的、木棍的和砖头的。狼吹倒了前两座，却吹不倒砖房。小猪们安全了。认真做事才能保护自己。',
  },
  {
    id: 'goldilocks',
    title: 'Goldilocks and the Three Bears',
    level: 3,
    source: 'Fairy Tale',
    category: 'story',
    content:
      'Goldilocks found a house in the woods. She tasted three bowls of porridge and sat on three chairs. Then she slept in a little bed. The three bears came home. Goldilocks woke up and ran away. Always ask before you use what is not yours.',
    translation:
      '金发姑娘在树林里发现一座房子。她尝了三碗粥，坐了三把椅子，又睡在一张小床上。三只熊回家了。金发姑娘醒来就跑了。用别人的东西之前要先问过。',
  },
]

export function findArticle(lang: 'en' | 'zh', id: string) {
  return (lang === 'en' ? EN_ARTICLES : ZH_ARTICLES).find((a) => a.id === id)
}

export function articlesOfCategory(lang: 'en' | 'zh', categoryId: string) {
  return (lang === 'en' ? EN_ARTICLES : ZH_ARTICLES).filter((a) => a.category === categoryId)
}

export function findCategory(lang: 'en' | 'zh', categoryId: string) {
  return (lang === 'en' ? EN_CATEGORIES : ZH_CATEGORIES).find((c) => c.id === categoryId)
}

export function catalogItems(articles: Article[]) {
  return articles.map((a) => ({ id: a.id, title: a.title, source: a.source }))
}
