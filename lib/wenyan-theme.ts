// Data + builder for the 挑戰模式 - 主旨理解挑戰 (main-idea comprehension) game.
//
// It reuses the four 學習模式 articles in `wenyan-texts.ts`. For each round we
// show one passage's 原文 together with its 白話翻譯, and ask the student to
// pick the article's 主旨 — the implied 道理/教訓 (隱含的道理). Each question has
// exactly one correct answer plus four 干擾選項 (distractors).
//
// Distractors are drawn first from the *other* articles' themes (so the student
// must tell the four morals apart) and then topped up from a shared pool of
// plausible-but-wrong morals, keeping every question at five options.

import { WENYAN_TEXTS, getWenyanText } from "./wenyan-texts";

/** The correct main idea (隱含道理) for one of the four articles. */
export interface ThemeEntry {
  /** Matches the `id` of the corresponding entry in `WENYAN_TEXTS`. */
  id: string;
  /** The article's main idea — the single correct answer. */
  theme: string;
}

export const WENYAN_THEMES: ThemeEntry[] = [
  {
    id: "lun-yu-si-ze",
    theme: "學習要按時溫習、學思並重，並虛心向身邊的人取長補短。",
  },
  {
    id: "er-zi-xue-yi",
    theme: "學習成敗的關鍵在於是否專心致志，而不在於天資的高低。",
  },
  {
    id: "zheng-ren-mai-lyu",
    theme: "做事要按實際情況靈活變通，不應死守教條而不知變通。",
  },
  {
    id: "yu-bang-xiang-zheng",
    theme: "雙方爭執互不相讓，最後往往只會讓第三者坐收漁利。",
  },
];

/** Plausible-but-wrong morals, used to top up distractors to four per question. */
export const THEME_DISTRACTOR_POOL: string[] = [
  "做人要誠實守信，答應別人的事就一定要做到。",
  "要珍惜光陰，今天能做的事不要拖延到明天。",
  "遇到困難要勇敢面對，絕不可以輕言放棄。",
  "凡事要未雨綢繆，事先做好周全的準備。",
  "要孝順父母、尊敬師長，做一個有禮的人。",
  "貪心不足往往招來禍患，知足才能常樂。",
  "團結合作的力量強大，眾人同心就能成事。",
];

export function getWenyanTheme(id: string): ThemeEntry | undefined {
  return WENYAN_THEMES.find((t) => t.id === id);
}

/* ----------------------------------------------------------- quiz builder */

export interface ThemeQuestion {
  /** The source article id. */
  id: string;
  /** Article title, e.g. 「論語四則」. */
  title: string;
  /** Article source, e.g. 「《論語》」. */
  source: string;
  /** Full original passage (sentences joined). */
  original: string;
  /** Full modern-Chinese translation (sentences joined). */
  translation: string;
  /** Five answer options (main ideas); exactly one is correct. */
  options: string[];
  /** Index of the correct option. */
  answerIndex: number;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Build a full round: one question per article (four in total), each shown with
 * its 原文 + 翻譯 and five main-idea options (1 correct + 4 distractors).
 */
export function buildThemeQuiz(): ThemeQuestion[] {
  return shuffle(WENYAN_THEMES).map((entry) => {
    const text = getWenyanText(entry.id);
    const original = text?.sentences.map((s) => s.original).join("") ?? "";
    const translation = text?.sentences.map((s) => s.translation).join("") ?? "";

    const otherThemes = WENYAN_THEMES.filter((t) => t.id !== entry.id).map(
      (t) => t.theme
    );

    const distractors = shuffle([...otherThemes, ...THEME_DISTRACTOR_POOL])
      .filter((d) => d !== entry.theme)
      .slice(0, 4);

    const options = shuffle([entry.theme, ...distractors]);

    return {
      id: entry.id,
      title: text?.title ?? entry.id,
      source: text?.source ?? "",
      original,
      translation,
      options,
      answerIndex: options.indexOf(entry.theme),
    };
  });
}

/** Number of questions in one 主旨理解挑戰 round (one per article). */
export const THEME_QUESTION_COUNT = WENYAN_TEXTS.length;

/* ------------------------------------------------ application challenge */

export interface ApplicationQuestion {
  /** The source article id. */
  id: string;
  /** Article title, e.g. 「論語四則」. */
  title: string;
  /** Article source, e.g. 「《論語》」. */
  source: string;
  /** Full original passage (sentences joined). */
  original: string;
  /** Full modern-Chinese translation (sentences joined). */
  translation: string;
  /** The article's main idea (隱含的道理), shown to the student. */
  mainIdea: string;
}

/**
 * Build a full 理解應用 round: one question per article (four in total). Each
 * question shows the 原文、翻譯 and the given 主旨, then asks the student to write
 * a real-life analogy that the AI will score.
 */
export function buildApplicationQuiz(): ApplicationQuestion[] {
  return shuffle(WENYAN_THEMES).map((entry) => {
    const text = getWenyanText(entry.id);
    return {
      id: entry.id,
      title: text?.title ?? entry.id,
      source: text?.source ?? "",
      original: text?.sentences.map((s) => s.original).join("") ?? "",
      translation: text?.sentences.map((s) => s.translation).join("") ?? "",
      mainIdea: entry.theme,
    };
  });
}

/** Number of questions in one 理解應用挑戰 round (one per article). */
export const APPLICATION_QUESTION_COUNT = WENYAN_TEXTS.length;
