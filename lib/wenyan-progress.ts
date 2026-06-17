// Client-side progress, score and badge store for the 學習文言文 game.
//
// Persists everything in localStorage (no DB / auth coupling), which keeps the
// game self-contained. All functions are safe to call on the server (they
// no-op without `window`).

import { WENYAN_CHARS, type WenyanChar } from "./wenyan-chars";

const LEARN_KEY = "wyt:learn:completed";
const BEST_KEY = "wyt:challenge:best";
const PLAYS_KEY = "wyt:challenge:plays";
const BADGES_KEY = "wyt:badges";

/* ----------------------------------------------------------------- badges */

export interface Badge {
  id: string;
  label: string;
  description: string;
  emoji: string;
}

export const BADGES: Badge[] = [
  { id: "first-try", label: "初試啼聲", description: "完成第一場挑戰", emoji: "🌱" },
  { id: "rising-star", label: "文言新星", description: "單場取得 60 分或以上", emoji: "⭐" },
  { id: "expert", label: "文言高手", description: "單場取得 80 分或以上", emoji: "🏅" },
  { id: "master", label: "文言大師", description: "單場取得滿分 100 分", emoji: "👑" },
  { id: "streak", label: "連勝達人", description: "單場連續答對 5 題", emoji: "🔥" },
  { id: "scholar", label: "勤學書生", description: "在學習模式完成一篇文章", emoji: "📖" },
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

/* ------------------------------------------------------------- public API */

export interface ProgressSnapshot {
  completedTexts: string[];
  bestScore: number;
  plays: number;
  badges: string[];
}

export function getProgress(): ProgressSnapshot {
  return {
    completedTexts: readJSON<string[]>(LEARN_KEY, []),
    bestScore: readJSON<number>(BEST_KEY, 0),
    plays: readJSON<number>(PLAYS_KEY, 0),
    badges: readJSON<string[]>(BADGES_KEY, []),
  };
}

/** Mark a learning text as completed. Returns the (possibly) updated badge list. */
export function markTextCompleted(textId: string): string[] {
  const completed = readJSON<string[]>(LEARN_KEY, []);
  if (!completed.includes(textId)) {
    completed.push(textId);
    writeJSON(LEARN_KEY, completed);
  }
  const badges = readJSON<string[]>(BADGES_KEY, []);
  if (completed.length > 0 && !badges.includes("scholar")) {
    badges.push("scholar");
    writeJSON(BADGES_KEY, badges);
  }
  return badges;
}

export interface ChallengeResult {
  /** 0–100 */
  score: number;
  /** Longest run of correct answers within the game. */
  maxStreak: number;
}

/**
 * Record a finished challenge. Returns the ids of badges that were newly
 * earned this round (so the UI can celebrate them).
 */
export function recordChallenge(result: ChallengeResult): string[] {
  const best = readJSON<number>(BEST_KEY, 0);
  if (result.score > best) writeJSON(BEST_KEY, result.score);

  const plays = readJSON<number>(PLAYS_KEY, 0) + 1;
  writeJSON(PLAYS_KEY, plays);

  const owned = new Set(readJSON<string[]>(BADGES_KEY, []));
  const newly: string[] = [];
  const award = (id: string) => {
    if (!owned.has(id)) {
      owned.add(id);
      newly.push(id);
    }
  };

  award("first-try");
  if (result.score >= 60) award("rising-star");
  if (result.score >= 80) award("expert");
  if (result.score >= 100) award("master");
  if (result.maxStreak >= 5) award("streak");

  writeJSON(BADGES_KEY, [...owned]);
  return newly;
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
