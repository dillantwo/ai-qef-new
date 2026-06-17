// Common classical-Chinese characters bank for the 挑戰模式 (Challenge mode)
// of the 學習文言文 topic.
//
// Every example sentence is drawn from a Hong Kong EDB Key Stage 2 recommended
// 文言 passage (論語四則、二子學弈、鄭人買履、鷸蚌相爭、折箭、朱子家訓), so the
// game stays aligned with the local primary-school curriculum:
//   https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/key-stage2.html
//
// The challenge picks a character, shows one of its example sentences (the
// "片段") with the character highlighted, and asks the student to choose the
// correct meaning — the wrong options are meanings of other characters here.

export interface WenyanChar {
  /** Stable id. */
  id: string;
  /** The single character being tested. */
  char: string;
  /** Pinyin hint. */
  pinyin: string;
  /** The plain-Chinese meaning (correct answer). */
  meaning: string;
  /** Short example sentences (from EDB KS2 passages) that contain `char`. */
  examples: string[];
}

export const WENYAN_CHARS: WenyanChar[] = [
  {
    id: "yue",
    char: "曰",
    pinyin: "yuē",
    meaning: "說",
    examples: ["子曰：「學而時習之，不亦說乎？」", "人曰：「何不試之以足？」"],
  },
  {
    id: "gu",
    char: "故",
    pinyin: "gù",
    meaning: "舊的",
    examples: ["溫故而知新，可以為師矣。"],
  },
  {
    id: "shan",
    char: "善",
    pinyin: "shàn",
    meaning: "擅長",
    examples: ["弈秋，通國之善弈者也。"],
  },
  {
    id: "qi-his",
    char: "其",
    pinyin: "qí",
    meaning: "他的、它的",
    examples: ["先自度其足，而置之其坐。", "其一人專心致志，惟弈秋之為聽。"],
  },
  {
    id: "shi-this",
    char: "是",
    pinyin: "shì",
    meaning: "這、這樣",
    examples: ["知之為知之，不知為不知，是知也。"],
  },
  {
    id: "wei-do",
    char: "為",
    pinyin: "wéi",
    meaning: "做、當",
    examples: ["溫故而知新，可以為師矣。"],
  },
  {
    id: "yi-also",
    char: "亦",
    pinyin: "yì",
    meaning: "也",
    examples: ["蚌亦謂鷸曰。", "學而時習之，不亦說乎？"],
  },
  {
    id: "sui-although",
    char: "雖",
    pinyin: "suī",
    meaning: "雖然",
    examples: ["雖與之俱學，弗若之矣。"],
  },
  {
    id: "fu-not",
    char: "弗",
    pinyin: "fú",
    meaning: "不",
    examples: ["雖與之俱學，弗若之矣。"],
  },
  {
    id: "wei-only",
    char: "惟",
    pinyin: "wéi",
    meaning: "只",
    examples: ["其一人專心致志，惟弈秋之為聽。"],
  },
  {
    id: "fan-return",
    char: "反",
    pinyin: "fǎn",
    meaning: "返回（同「返」）",
    examples: ["及反，市罷，遂不得履。"],
  },
  {
    id: "ji-reach",
    char: "及",
    pinyin: "jí",
    meaning: "等到",
    examples: ["及反，市罷，遂不得履。"],
  },
  {
    id: "zhi-go",
    char: "之",
    pinyin: "zhī",
    meaning: "前往、到……去",
    examples: ["至之市，而忘操之。"],
  },
  {
    id: "lyu-shoe",
    char: "履",
    pinyin: "lǚ",
    meaning: "鞋子",
    examples: ["鄭人有欲買履者。", "已得履，乃曰：「吾忘持度。」"],
  },
  {
    id: "du-size",
    char: "度",
    pinyin: "dù",
    meaning: "量好的尺碼",
    examples: ["寧信度，無自信也。", "已得履，乃曰：「吾忘持度。」"],
  },
  {
    id: "hui-teach",
    char: "誨",
    pinyin: "huì",
    meaning: "教導",
    examples: ["使弈秋誨二人弈。"],
  },
  {
    id: "zhe-break",
    char: "折",
    pinyin: "zhé",
    meaning: "折斷",
    examples: ["汝取一隻箭折之。", "單者易折，眾則難摧。"],
  },
  {
    id: "yu-rain",
    char: "雨",
    pinyin: "yù",
    meaning: "下雨",
    examples: ["今日不雨，明日不雨，即有死蚌。"],
  },
  {
    id: "ji-already",
    char: "既",
    pinyin: "jì",
    meaning: "已經",
    examples: ["既昏便息，關鎖門戶，必親自檢點。"],
  },
  {
    id: "xi-rest",
    char: "息",
    pinyin: "xī",
    meaning: "休息",
    examples: ["既昏便息，關鎖門戶，必親自檢點。"],
  },
  {
    id: "si-think",
    char: "思",
    pinyin: "sī",
    meaning: "思考、想",
    examples: ["學而不思則罔，思而不學則殆。"],
  },
  {
    id: "ba-end",
    char: "罷",
    pinyin: "bà",
    meaning: "結束、（市集）散了",
    examples: ["及反，市罷，遂不得履。"],
  },
];

export function getWenyanChar(id: string): WenyanChar | undefined {
  return WENYAN_CHARS.find((c) => c.id === id);
}
