// Client-side progress, score and badge store for the 學習文言文 game.
//
// Persists everything in localStorage (no DB / auth coupling), which keeps the
// game self-contained. All functions are safe to call on the server (they
// no-op without `window`).
//
// The four 挑戰模式 (常用詞翻譯 / 常用詞拼圖 / 主旨理解 / 理解應用) keep their best
// score and play count separately; the "總分" shown on the dashboard is the sum
// of all four best scores.

import { WENYAN_CHARS, type WenyanChar } from "./wenyan-chars";
import { WENYAN_TEXTS } from "./wenyan-texts";

const LEARN_KEY = "wyt:learn:completed";
const BADGES_KEY = "wyt:badges";

// Per-mode best score + play count.
const BEST_TRANSLATE_KEY = "wyt:challenge:best:translate";
const BEST_PUZZLE_KEY = "wyt:challenge:best:puzzle";
const BEST_THEME_KEY = "wyt:challenge:best:theme";
const BEST_APPLICATION_KEY = "wyt:challenge:best:application";
const PLAYS_TRANSLATE_KEY = "wyt:challenge:plays:translate";
const PLAYS_PUZZLE_KEY = "wyt:challenge:plays:puzzle";
const PLAYS_THEME_KEY = "wyt:challenge:plays:theme";
const PLAYS_APPLICATION_KEY = "wyt:challenge:plays:application";

// Legacy (single-mode) keys, migrated into the translate slot on first read.
const LEGACY_BEST_KEY = "wyt:challenge:best";
const LEGACY_PLAYS_KEY = "wyt:challenge:plays";

/** The four challenge games. */
export type ChallengeMode = "translate" | "puzzle" | "theme" | "application";

/** Max possible total score (each mode caps at 100). */
export const MAX_TOTAL_SCORE = 400;

/* ----------------------------------------------------------------- badges */

export interface Badge {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGES: Badge[] = [
  // —— 學習模式 ——
  { id: "scholar", label: "勤學書生", description: "在學習模式完成第一篇文章", emoji: "📖" },
  { id: "all-texts", label: "博覽群書", description: "學習模式完成全部四篇文章", emoji: "📚" },

  // —— 挑戰里程碑（任何模式）——
  { id: "first-try", label: "初試啼聲", description: "完成第一場挑戰", emoji: "🌱" },
  { id: "rising-star", label: "文言新星", description: "任何挑戰單場取得 60 分或以上", emoji: "⭐" },
  { id: "expert", label: "文言高手", description: "任何挑戰單場取得 80 分或以上", emoji: "🏅" },
  { id: "master", label: "文言大師", description: "任何挑戰單場取得滿分 100 分", emoji: "👑" },

  // —— 四種挑戰模式的專屬獎章（單場 80 分或以上）——
  { id: "translate-ace", label: "識字高手", description: "常用詞翻譯取得 80 分或以上", emoji: "✍️" },
  { id: "puzzle-ace", label: "拼圖高手", description: "常用詞拼圖取得 80 分或以上", emoji: "🧩" },
  { id: "theme-ace", label: "明理達人", description: "主旨理解取得 80 分或以上", emoji: "💡" },
  { id: "apply-ace", label: "活學活用", description: "理解應用取得 80 分或以上", emoji: "🌟" },

  // —— 毅力與綜合成就 ——
  { id: "diligent", label: "持之以恆", description: "累積挑戰 10 次", emoji: "📅" },
  { id: "all-modes", label: "四項全能", description: "四種挑戰模式都玩過", emoji: "⚔️" },
  { id: "grand-total", label: "登峰造極", description: "四種模式總分達 360 分", emoji: "🏆" },
  { id: "perfect-all", label: "完美無瑕", description: "四種挑戰模式全部取得滿分 100 分", emoji: "💎" },
];

export function getBadge(id: string): Badge | undefined {
  return BADGES.find((b) => b.id === id);
}

/* --------------------------------------------------------------- internals */

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore quota / private-mode errors */
  }
}

/** One-time migration of the old single-mode score into the translate slot. */
function migrateLegacy() {
  if (typeof window === "undefined") return;
  try {
    const oldBest = window.localStorage.getItem(LEGACY_BEST_KEY);
    if (oldBest !== null && window.localStorage.getItem(BEST_TRANSLATE_KEY) === null) {
      window.localStorage.setItem(BEST_TRANSLATE_KEY, oldBest);
    }
    const oldPlays = window.localStorage.getItem(LEGACY_PLAYS_KEY);
    if (oldPlays !== null && window.localStorage.getItem(PLAYS_TRANSLATE_KEY) === null) {
      window.localStorage.setItem(PLAYS_TRANSLATE_KEY, oldPlays);
    }
  } catch {
    /* ignore */
  }
}

function awardBadges(mutate: (award: (id: string) => void) => void): string[] {
  const owned = new Set(readJSON<string[]>(BADGES_KEY, []));
  const newly: string[] = [];
  const award = (id: string) => {
    if (!owned.has(id)) {
      owned.add(id);
      newly.push(id);
    }
  };
  mutate(award);
  if (newly.length) writeJSON(BADGES_KEY, [...owned]);
  return newly;
}

/* ------------------------------------------------------------- public API */

export interface ProgressSnapshot {
  completedTexts: string[];
  /** Best score in the 常用詞翻譯 game (0–100). */
  bestTranslate: number;
  /** Best score in the 常用詞拼圖 game (0–100). */
  bestPuzzle: number;
  /** Best score in the 主旨理解 game (0–100). */
  bestTheme: number;
  /** Best score in the 理解應用 game (0–100). */
  bestApplication: number;
  /** Play counts per mode. */
  playsTranslate: number;
  playsPuzzle: number;
  playsTheme: number;
  playsApplication: number;
  /** Combined best score across all modes (0–400). */
  totalScore: number;
  badges: string[];
}

export function getProgress(): ProgressSnapshot {
  migrateLegacy();
  const bestTranslate = readJSON<number>(BEST_TRANSLATE_KEY, 0);
  const bestPuzzle = readJSON<number>(BEST_PUZZLE_KEY, 0);
  const bestTheme = readJSON<number>(BEST_THEME_KEY, 0);
  const bestApplication = readJSON<number>(BEST_APPLICATION_KEY, 0);
  return {
    completedTexts: readJSON<string[]>(LEARN_KEY, []),
    bestTranslate,
    bestPuzzle,
    bestTheme,
    bestApplication,
    playsTranslate: readJSON<number>(PLAYS_TRANSLATE_KEY, 0),
    playsPuzzle: readJSON<number>(PLAYS_PUZZLE_KEY, 0),
    playsTheme: readJSON<number>(PLAYS_THEME_KEY, 0),
    playsApplication: readJSON<number>(PLAYS_APPLICATION_KEY, 0),
    totalScore: bestTranslate + bestPuzzle + bestTheme + bestApplication,
    badges: readJSON<string[]>(BADGES_KEY, []),
  };
}

/** Mark a learning text as completed. Returns the full owned-badge list. */
export function markTextCompleted(textId: string): string[] {
  const completed = readJSON<string[]>(LEARN_KEY, []);
  if (!completed.includes(textId)) {
    completed.push(textId);
    writeJSON(LEARN_KEY, completed);
  }
  awardBadges((award) => {
    if (completed.length > 0) award("scholar");
    if (completed.length >= WENYAN_TEXTS.length) award("all-texts");
  });
  return readJSON<string[]>(BADGES_KEY, []);
}

export interface ChallengeResult {
  /** 0–100 */
  score: number;
  /** Longest run of correct answers within the game. */
  maxStreak: number;
}

/**
 * Record a finished challenge for a given mode. Returns the ids of badges that
 * were newly earned this round (so the UI can celebrate them).
 */
export function recordChallenge(
  mode: ChallengeMode,
  result: ChallengeResult
): string[] {
  migrateLegacy();
  const bestKey =
    mode === "translate"
      ? BEST_TRANSLATE_KEY
      : mode === "puzzle"
        ? BEST_PUZZLE_KEY
        : mode === "theme"
          ? BEST_THEME_KEY
          : BEST_APPLICATION_KEY;
  const playsKey =
    mode === "translate"
      ? PLAYS_TRANSLATE_KEY
      : mode === "puzzle"
        ? PLAYS_PUZZLE_KEY
        : mode === "theme"
          ? PLAYS_THEME_KEY
          : PLAYS_APPLICATION_KEY;

  const best = readJSON<number>(bestKey, 0);
  if (result.score > best) writeJSON(bestKey, result.score);
  writeJSON(playsKey, readJSON<number>(playsKey, 0) + 1);

  // Re-read everything for cross-mode / total badges.
  const bestTranslate = readJSON<number>(BEST_TRANSLATE_KEY, 0);
  const bestPuzzle = readJSON<number>(BEST_PUZZLE_KEY, 0);
  const bestTheme = readJSON<number>(BEST_THEME_KEY, 0);
  const bestApplication = readJSON<number>(BEST_APPLICATION_KEY, 0);
  const playsTranslate = readJSON<number>(PLAYS_TRANSLATE_KEY, 0);
  const playsPuzzle = readJSON<number>(PLAYS_PUZZLE_KEY, 0);
  const playsTheme = readJSON<number>(PLAYS_THEME_KEY, 0);
  const playsApplication = readJSON<number>(PLAYS_APPLICATION_KEY, 0);

  return awardBadges((award) => {
    award("first-try");
    if (result.score >= 60) award("rising-star");
    if (result.score >= 80) award("expert");
    if (result.score >= 100) award("master");
    if (mode === "translate" && result.score >= 80) award("translate-ace");
    if (mode === "puzzle" && result.score >= 80) award("puzzle-ace");
    if (mode === "theme" && result.score >= 80) award("theme-ace");
    if (mode === "application" && result.score >= 80) award("apply-ace");
    if (
      playsTranslate > 0 &&
      playsPuzzle > 0 &&
      playsTheme > 0 &&
      playsApplication > 0
    )
      award("all-modes");
    if (playsTranslate + playsPuzzle + playsTheme + playsApplication >= 10)
      award("diligent");
    if (bestTranslate + bestPuzzle + bestTheme + bestApplication >= 360)
      award("grand-total");
    if (
      bestTranslate >= 100 &&
      bestPuzzle >= 100 &&
      bestTheme >= 100 &&
      bestApplication >= 100
    )
      award("perfect-all");
  });
}

/* ----------------------------------------------------- challenge quiz gen */

export interface QuizQuestion {
  char: WenyanChar;
  /** The example sentence shown to the student. */
  sentence: string;
  /** Four answer options (plain-Chinese meanings); one matches char.meaning. */
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

/** Build a fresh set of multiple-choice questions for one challenge round. */
export function buildQuiz(count = 10): QuizQuestion[] {
  const chars = shuffle(WENYAN_CHARS).slice(0, count);

  return chars.map((char) => {
    const sentence =
      char.examples[Math.floor(Math.random() * char.examples.length)];

    // Distractor meanings come from other characters with a different meaning.
    const distractors = shuffle(
      WENYAN_CHARS.filter(
        (c) => c.id !== char.id && c.meaning !== char.meaning
      )
    )
      .slice(0, 3)
      .map((c) => c.meaning);

    const options = shuffle([char.meaning, ...distractors]);
    return {
      char,
      sentence,
      options,
      answerIndex: options.indexOf(char.meaning),
    };
  });
}
