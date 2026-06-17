// Data for the Chinese "學習文言文" (Classical Chinese learning) topic.
//
// Content is aligned with the Hong Kong EDB recommended passages for
// 第二學習階段（小三至小六） / Key Stage 2:
//   https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/key-stage2.html
// The KS2 classical-prose (文言) passages are: 論語四則、二子學弈、鄭人買履、
// 鷸蚌相爭、折箭、朱子家訓（節錄）. This topic currently covers 折箭、
// 朱子家訓（節錄）與鷸蚌相爭.
//
// Each text is broken into sentences. Every sentence carries:
//   - original: the classical Chinese sentence
//   - segments: a word-by-word / phrase-by-phrase breakdown (句子成分拆解)
//   - translation: a reference modern-Chinese translation.
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
  /** Word/phrase breakdown for the learning breakdown task. */
  segments: WenyanSegment[];
  /** Reference modern-Chinese translation. */
  translation: string;
}

export interface WenyanText {
  id: string;
  title: string;
  source: string;
  /** One-line summary shown on the selection card. */
  summary: string;
  /** A short intro / moral shown at the top of the reading task. */
  intro: string;
  sentences: WenyanSentence[];
}

export const WENYAN_TEXTS: WenyanText[] = [
  {
    id: "zhe-jian",
    title: "折箭",
    source: "《魏書》",
    summary: "阿豺用折一支箭和折一束箭，教二十個兒子明白團結的道理。",
    intro:
      "這是香港教育局建議小學閱讀的篇章，出自《魏書》。首領阿豺用「折箭」這個小實驗，教兒子們一個大道理：一個人的力量單薄，大家齊心合力才會強大。",
    sentences: [
      {
        id: "s1",
        original: "阿豺有子二十人。",
        segments: [
          { text: "阿豺", meaning: "吐谷渾的首領，名叫阿豺（人名）" },
          { text: "有子二十人", meaning: "有二十個兒子" },
        ],
        translation: "阿豺有二十個兒子。",
      },
      {
        id: "s2",
        original: "阿豺謂曰：「汝等各奉吾一隻箭，折之地下。」",
        segments: [
          { text: "謂曰", meaning: "對他們說（謂＝告訴、對……說）" },
          { text: "汝等", meaning: "你們（汝＝你）" },
          { text: "各奉吾一隻箭", meaning: "每人交給我一支箭（奉＝獻上、交給）" },
          { text: "折之地下", meaning: "把它折斷，扔在地上（折＝折斷）" },
        ],
        translation: "阿豺對兒子們說：「你們每人拿一支箭，把它折斷扔在地上。」",
      },
      {
        id: "s3",
        original: "俄而命母弟慕利延曰：「汝取一隻箭折之。」慕利延折之。",
        segments: [
          { text: "俄而", meaning: "不久、一會兒" },
          { text: "命", meaning: "吩咐、命令" },
          { text: "母弟慕利延", meaning: "同母的弟弟慕利延（人名）" },
          { text: "汝取一隻箭折之", meaning: "你拿一支箭把它折斷" },
          { text: "慕利延折之", meaning: "慕利延就把箭折斷了" },
        ],
        translation:
          "不久，阿豺吩咐同母的弟弟慕利延說：「你拿一支箭把它折斷。」慕利延就把箭折斷了。",
      },
      {
        id: "s4",
        original: "又曰：「汝取十九隻箭折之。」慕利延不能折。",
        segments: [
          { text: "又曰", meaning: "又說" },
          { text: "汝取十九隻箭折之", meaning: "你拿十九支箭一起折斷" },
          { text: "不能折", meaning: "折不斷（能＝能夠）" },
        ],
        translation: "阿豺又說：「你拿十九支箭一起折斷它們。」慕利延卻折不斷。",
      },
      {
        id: "s5",
        original: "阿豺曰：「汝曹知否？單者易折，眾則難摧。戮力一心，然後社稷可固。」",
        segments: [
          { text: "汝曹知否", meaning: "你們知道嗎（汝曹＝你們）" },
          { text: "單者易折", meaning: "單獨一支容易折斷" },
          { text: "眾則難摧", meaning: "數量多就難以折斷（摧＝折斷、毀壞）" },
          { text: "戮力一心", meaning: "齊心合力（戮力 lù lì＝合力）" },
          { text: "然後社稷可固", meaning: "這樣國家才能穩固（社稷＝國家）" },
        ],
        translation:
          "阿豺說：「你們明白嗎？一支箭容易折斷，許多支就難以折斷。大家齊心合力，國家才能穩固。」",
      },
    ],
  },
  {
    id: "zhu-zi-jia-xun",
    title: "朱子家訓（節錄）",
    source: "朱柏廬",
    summary: "幾句治家格言，教人勤勞、整潔，懂得珍惜每一口飯、每一根線。",
    intro:
      "《朱子家訓》是香港教育局建議小學閱讀的篇章，作者是清代的朱柏廬。它用簡短的句子教導做人和持家的道理。以下節錄幾句，想一想：你平日有沒有做到呢？",
    sentences: [
      {
        id: "s1",
        original: "黎明即起，灑掃庭除，要內外整潔。",
        segments: [
          { text: "黎明即起", meaning: "天剛亮就起床（黎明＝天快亮的時候）" },
          { text: "灑掃庭除", meaning: "打掃庭院（庭除＝庭院、台階）" },
          { text: "要內外整潔", meaning: "要使屋內屋外都乾淨整齊" },
        ],
        translation: "天一亮就起床，打掃庭院，使屋裏屋外都保持整潔。",
      },
      {
        id: "s2",
        original: "既昏便息，關鎖門戶，必親自檢點。",
        segments: [
          { text: "既昏", meaning: "天黑以後（既＝已經，昏＝天黑）" },
          { text: "便息", meaning: "就休息（息＝休息）" },
          { text: "關鎖門戶", meaning: "關好、鎖好門窗" },
          { text: "必親自檢點", meaning: "一定要親自檢查清楚（檢點＝查看）" },
        ],
        translation: "天黑了就休息，關鎖好門窗，一定要親自檢查清楚。",
      },
      {
        id: "s3",
        original: "一粥一飯，當思來處不易；半絲半縷，恆念物力維艱。",
        segments: [
          { text: "一粥一飯", meaning: "每一口粥、每一碗飯" },
          { text: "當思來處不易", meaning: "應當想到它得來不容易（當＝應該）" },
          { text: "半絲半縷", meaning: "半根絲、半條線，指一點點布料" },
          { text: "恆念物力維艱", meaning: "要常常想到物資得來艱難（恆＝經常，維艱＝艱難）" },
        ],
        translation:
          "每一口粥、每一碗飯，都應想到它得來不易；半根絲、半條線，也要常想到物力是多麼艱難得來的。",
      },
    ],
  },
  {
    id: "yu-bang-xiang-zheng",
    title: "鷸蚌相爭",
    source: "《戰國策》",
    summary: "鷸鳥和河蚌互不相讓，結果一起被漁夫捉去。",
    intro:
      "這是香港教育局建議小學閱讀的篇章，出自《戰國策》，後來變成成語「鷸蚌相爭，漁人得利」。它提醒我們：雙方爭執不肯退讓，往往會讓第三者佔了便宜。",
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
        translation: "鷸鳥說：「今天不下雨，明天不下雨，就會有一隻乾死的河蚌。」",
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
