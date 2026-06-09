// Data for the Chinese "學習文言文" (Classical Chinese learning) topic.
// Each text is broken into sentences. Every sentence carries:
//   - original: the classical Chinese sentence
//   - segments: a word-by-word / phrase-by-phrase breakdown (句子成分拆解)
//   - translation: a reference modern-Chinese translation used both as a
//     student hint and as the grading reference for the AI translation check.
//
// Targeted at Hong Kong primary students, so explanations stay簡潔淺白.

export interface WenyanSegment {
  /** The character or phrase being explained. */
  text: string;
  /** A short, plain explanation of the segment's meaning / role. */
  meaning: string;
}

export interface WenyanSentence {
  /** Stable id within the text (used as a React key / answer key). */
  id: string;
  /** The original classical Chinese sentence. */
  original: string;
  /** Word/phrase breakdown for Task 2. */
  segments: WenyanSegment[];
  /** Reference modern-Chinese translation for Task 3 grading. */
  translation: string;
}

export interface WenyanText {
  id: string;
  title: string;
  source: string;
  /** One-line summary shown on the selection card. */
  summary: string;
  /** A short intro / moral shown at the top of Task 1. */
  intro: string;
  sentences: WenyanSentence[];
}

export const WENYAN_TEXTS: WenyanText[] = [
  {
    id: "zheng-ren-mai-lyu",
    title: "鄭人買履",
    source: "《韓非子》",
    summary: "一個鄭國人買鞋，寧願相信尺碼也不相信自己的腳。",
    intro:
      "這個故事出自《韓非子》。它笑話那些做事死板、只信書本和規矩，卻不肯面對現實的人。讀完後想一想：你有沒有試過明明可以親自試試，卻偏要依賴別的方法呢？",
    sentences: [
      {
        id: "s1",
        original: "鄭人有欲買履者，先自度其足，而置之其坐。",
        segments: [
          { text: "鄭人", meaning: "鄭國有一個人" },
          { text: "欲", meaning: "想要" },
          { text: "買履", meaning: "買鞋子（履＝鞋）" },
          { text: "自度其足", meaning: "自己量度腳的尺寸（度 duó＝量度）" },
          { text: "置", meaning: "放置" },
          { text: "之", meaning: "它，指量好的尺碼" },
          { text: "其坐", meaning: "他的座位（坐＝座）" },
        ],
        translation:
          "鄭國有一個想買鞋子的人，先自己量好腳的尺碼，然後把尺碼放在座位上。",
      },
      {
        id: "s2",
        original: "至之市，而忘操之。",
        segments: [
          { text: "至", meaning: "到了" },
          { text: "之市", meaning: "前往集市（之＝往、到……去）" },
          { text: "忘", meaning: "忘記" },
          { text: "操之", meaning: "帶着它，指那量好的尺碼（操＝拿、帶）" },
        ],
        translation: "到了集市，卻忘記帶那量好的尺碼。",
      },
      {
        id: "s3",
        original: "已得履，乃曰：「吾忘持度。」",
        segments: [
          { text: "已得履", meaning: "已經拿到鞋子" },
          { text: "乃", meaning: "於是、就" },
          { text: "曰", meaning: "說" },
          { text: "吾", meaning: "我" },
          { text: "忘持度", meaning: "忘了帶尺碼（度 dù＝量好的尺碼）" },
        ],
        translation: "已經拿到鞋子，他卻說：「我忘了帶尺碼。」",
      },
      {
        id: "s4",
        original: "反歸取之。",
        segments: [
          { text: "反", meaning: "同「返」，返回" },
          { text: "歸", meaning: "回家" },
          { text: "取之", meaning: "拿尺碼回來（之＝尺碼）" },
        ],
        translation: "於是返回家去拿尺碼。",
      },
      {
        id: "s5",
        original: "及反，市罷，遂不得履。",
        segments: [
          { text: "及反", meaning: "等到他回來（及＝等到，反＝返回集市）" },
          { text: "市罷", meaning: "集市已經散了" },
          { text: "遂", meaning: "終於、結果" },
          { text: "不得履", meaning: "買不到鞋子" },
        ],
        translation: "等到他回來，集市已經散了，結果買不到鞋子。",
      },
      {
        id: "s6",
        original: "人曰：「何不試之以足？」",
        segments: [
          { text: "人曰", meaning: "有人說" },
          { text: "何不", meaning: "為甚麼不" },
          { text: "試之", meaning: "試一試（鞋子）" },
          { text: "以足", meaning: "用腳" },
        ],
        translation: "有人說：「為甚麼不用腳直接試穿呢？」",
      },
      {
        id: "s7",
        original: "曰：「寧信度，無自信也。」",
        segments: [
          { text: "曰", meaning: "他回答說" },
          { text: "寧", meaning: "寧願" },
          { text: "信度", meaning: "相信尺碼" },
          { text: "無自信", meaning: "也不相信自己（的腳）" },
          { text: "也", meaning: "語氣詞" },
        ],
        translation: "他說：「我寧願相信尺碼，也不相信自己的腳。」",
      },
    ],
  },
  {
    id: "lun-yu-si-ze",
    title: "論語四則",
    source: "《論語》",
    summary: "孔子論學習與做人的四句名言。",
    intro:
      "《論語》記錄了孔子和學生的言行。以下四則都是談「學習」和「做人」的名句，雖然簡短，卻很有道理。讀的時候，試試把它和自己的學習經驗聯繫起來。",
    sentences: [
      {
        id: "s1",
        original:
          "子曰：「學而時習之，不亦說乎？有朋自遠方來，不亦樂乎？人不知而不慍，不亦君子乎？」",
        segments: [
          { text: "子曰", meaning: "孔子說（子＝對孔子的尊稱）" },
          { text: "學而時習之", meaning: "學習後按時溫習它（時＝按時，習＝溫習）" },
          { text: "不亦說乎", meaning: "不也是很喜悅嗎（說＝悅，喜悅）" },
          { text: "有朋自遠方來", meaning: "有朋友從遠方來（自＝從）" },
          { text: "不亦樂乎", meaning: "不也是很快樂嗎" },
          { text: "人不知而不慍", meaning: "別人不了解自己卻不惱怒（慍 yùn＝生氣）" },
          { text: "不亦君子乎", meaning: "不也是有德行的君子嗎" },
        ],
        translation:
          "孔子說：「學習後按時溫習，不也是很喜悅嗎？有朋友從遠方來，不也是很快樂嗎？別人不了解自己卻不惱怒，不也是君子嗎？」",
      },
      {
        id: "s2",
        original: "子曰：「溫故而知新，可以為師矣。」",
        segments: [
          { text: "溫故", meaning: "溫習舊知識（故＝舊的）" },
          { text: "知新", meaning: "領悟新的道理" },
          { text: "可以為師", meaning: "可以做老師（為＝做）" },
          { text: "矣", meaning: "語氣詞，相當於「了」" },
        ],
        translation: "孔子說：「溫習舊知識，從而領悟新的道理，就可以做老師了。」",
      },
      {
        id: "s3",
        original: "子曰：「學而不思則罔，思而不學則殆。」",
        segments: [
          { text: "學而不思", meaning: "只學習卻不思考" },
          { text: "則", meaning: "就" },
          { text: "罔", meaning: "迷惘，沒有收穫（罔 wǎng）" },
          { text: "思而不學", meaning: "只空想卻不學習" },
          { text: "殆", meaning: "疑惑而沒把握（殆 dài）" },
        ],
        translation:
          "孔子說：「只學習卻不思考，就會感到迷惘；只空想卻不學習，就會陷入疑惑。」",
      },
      {
        id: "s4",
        original: "子曰：「知之為知之，不知為不知，是知也。」",
        segments: [
          { text: "知之為知之", meaning: "知道就說知道（為＝就是）" },
          { text: "不知為不知", meaning: "不知道就說不知道" },
          { text: "是知也", meaning: "這才是真正的聰明（知＝智，智慧）" },
        ],
        translation:
          "孔子說：「知道就說知道，不知道就說不知道，這才是真正的聰明智慧。」",
      },
    ],
  },
  {
    id: "er-zi-xue-yi",
    title: "二子學弈",
    source: "《孟子》",
    summary: "兩人同跟名師學下棋，結果卻大不相同。",
    intro:
      "這個故事出自《孟子》，又叫《學弈》。兩個人一起跟同一位高手學下棋，一個專心、一個分心，結果差別很大。它告訴我們：學習能不能成功，關鍵在於是否專心。",
    sentences: [
      {
        id: "s1",
        original: "弈秋，通國之善弈者也。",
        segments: [
          { text: "弈秋", meaning: "一個名叫秋的下棋高手（弈＝下棋）" },
          { text: "通國", meaning: "全國" },
          { text: "之", meaning: "的" },
          { text: "善弈者", meaning: "擅長下棋的人" },
          { text: "也", meaning: "語氣詞，表示判斷" },
        ],
        translation: "弈秋，是全國最擅長下棋的人。",
      },
      {
        id: "s2",
        original: "使弈秋誨二人弈，其一人專心致志，惟弈秋之為聽；",
        segments: [
          { text: "使", meaning: "讓" },
          { text: "誨", meaning: "教導（誨 huì）" },
          { text: "二人弈", meaning: "兩個人下棋" },
          { text: "其一人", meaning: "其中一個人" },
          { text: "專心致志", meaning: "集中精神，一心一意" },
          { text: "惟弈秋之為聽", meaning: "只聽弈秋的講解（惟＝只）" },
        ],
        translation:
          "讓弈秋教兩個人下棋，其中一個人專心一意，只聽弈秋的講解；",
      },
      {
        id: "s3",
        original: "一人雖聽之，一心以為有鴻鵠將至，思援弓繳而射之。",
        segments: [
          { text: "一人雖聽之", meaning: "另一個人雖然也在聽（雖＝雖然）" },
          { text: "一心以為", meaning: "心裏卻一直以為" },
          { text: "有鴻鵠將至", meaning: "有天鵝快要飛來（鴻鵠 hóng hú＝天鵝）" },
          { text: "思", meaning: "想着" },
          { text: "援弓繳", meaning: "拿起弓箭（繳 jiǎo＝繫着絲繩的箭）" },
          { text: "而射之", meaning: "去射牠" },
        ],
        translation:
          "另一個人雖然也在聽，心裏卻以為有天鵝快要飛來，想着拿起弓箭去射牠。",
      },
      {
        id: "s4",
        original: "雖與之俱學，弗若之矣。",
        segments: [
          { text: "雖", meaning: "雖然" },
          { text: "與之俱學", meaning: "跟前一個人一起學習（俱＝一起）" },
          { text: "弗若之", meaning: "比不上他（弗＝不，若＝及、比得上）" },
          { text: "矣", meaning: "語氣詞，相當於「了」" },
        ],
        translation: "雖然他跟前一個人一起學習，成績卻比不上人家。",
      },
      {
        id: "s5",
        original: "為是其智弗若與？曰：非然也。",
        segments: [
          { text: "為是", meaning: "是因為" },
          { text: "其智弗若", meaning: "他的智力不如人" },
          { text: "與", meaning: "嗎，表示疑問（與 yú）" },
          { text: "曰", meaning: "回答說" },
          { text: "非然也", meaning: "不是這樣的（非＝不是，然＝這樣）" },
        ],
        translation: "是因為他的智力不如人嗎？回答說：不是這樣的。",
      },
    ],
  },
  {
    id: "yu-bang-xiang-zheng",
    title: "鷸蚌相爭",
    source: "《戰國策》",
    summary: "鷸鳥和河蚌互不相讓，結果一起被漁夫捉去。",
    intro:
      "這個故事出自《戰國策》，後來變成成語「鷸蚌相爭，漁人得利」。它提醒我們：雙方爭執不肯退讓，往往會讓第三者佔了便宜。",
    sentences: [
      {
        id: "s1",
        original: "蚌方出曝，而鷸啄其肉，蚌合而箝其喙。",
        segments: [
          { text: "蚌方出曝", meaning: "河蚌正出來曬太陽（蚌 bàng，曝 pù＝曬）" },
          { text: "鷸", meaning: "一種長嘴的水鳥（鷸 yù）" },
          { text: "啄其肉", meaning: "啄食蚌的肉" },
          { text: "蚌合", meaning: "河蚌合上殼" },
          { text: "箝其喙", meaning: "夾住鷸的嘴（箝 qián＝夾住，喙 huì＝鳥嘴）" },
        ],
        translation:
          "河蚌正出來曬太陽，一隻鷸鳥來啄牠的肉，河蚌立刻合上殼，夾住了鷸的嘴。",
      },
      {
        id: "s2",
        original: "鷸曰：「今日不雨，明日不雨，即有死蚌。」",
        segments: [
          { text: "鷸曰", meaning: "鷸鳥說" },
          { text: "今日不雨", meaning: "今天不下雨（雨＝下雨，作動詞）" },
          { text: "明日不雨", meaning: "明天也不下雨" },
          { text: "即有死蚌", meaning: "就會有一隻乾死的河蚌（即＝就）" },
        ],
        translation:
          "鷸鳥說：「今天不下雨，明天不下雨，就會有一隻乾死的河蚌。」",
      },
      {
        id: "s3",
        original: "蚌亦謂鷸曰：「今日不出，明日不出，即有死鷸。」",
        segments: [
          { text: "蚌亦謂鷸曰", meaning: "河蚌也對鷸鳥說（亦＝也，謂＝對……說）" },
          { text: "今日不出", meaning: "今天不放開你（鷸的嘴抽不出來）" },
          { text: "明日不出", meaning: "明天也不放開" },
          { text: "即有死鷸", meaning: "就會有一隻餓死的鷸鳥" },
        ],
        translation:
          "河蚌也對鷸鳥說：「今天不放你出來，明天不放你出來，就會有一隻餓死的鷸鳥。」",
      },
      {
        id: "s4",
        original: "兩者不肯相舍，漁者得而並禽之。",
        segments: [
          { text: "兩者", meaning: "鷸和蚌雙方" },
          { text: "不肯相舍", meaning: "都不肯互相放開（舍＝捨，放開）" },
          { text: "漁者", meaning: "漁夫" },
          { text: "得而並禽之", meaning: "趁機把牠們一起捉住（並＝一起，禽＝擒，捉住）" },
        ],
        translation: "雙方都不肯放開對方，漁夫便趁機把牠們一起捉住了。",
      },
    ],
  },
];

export function getWenyanText(id: string): WenyanText | undefined {
  return WENYAN_TEXTS.find((t) => t.id === id);
}
