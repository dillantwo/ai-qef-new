"use client";

import { useState } from "react";
import {
  Highlighter,
  Loader2,
  Eraser,
  Sparkles,
  BookOpen,
  ScrollText,
  List,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { basePath } from "@/lib/utils";

interface Annotation {
  word: string;
  positions: number[];
  partOfSpeech: string;
  meaning: string;
}

const COLORS = [
  { bg: "bg-orange-200/80", text: "text-orange-900", ring: "ring-orange-300", activeBg: "bg-orange-100" },
  { bg: "bg-emerald-200/80", text: "text-emerald-900", ring: "ring-emerald-300", activeBg: "bg-emerald-100" },
  { bg: "bg-purple-200/80", text: "text-purple-900", ring: "ring-purple-300", activeBg: "bg-purple-100" },
  { bg: "bg-sky-200/80", text: "text-sky-900", ring: "ring-sky-300", activeBg: "bg-sky-100" },
  { bg: "bg-pink-200/80", text: "text-pink-900", ring: "ring-pink-300", activeBg: "bg-pink-100" },
  { bg: "bg-amber-200/80", text: "text-amber-900", ring: "ring-amber-300", activeBg: "bg-amber-100" },
  { bg: "bg-teal-200/80", text: "text-teal-900", ring: "ring-teal-300", activeBg: "bg-teal-100" },
  { bg: "bg-rose-200/80", text: "text-rose-900", ring: "ring-rose-300", activeBg: "bg-rose-100" },
];

const SAMPLE_TEXT = `魚，我所欲也；熊掌，亦我所欲也。二者不可得兼，舍魚而取熊掌者也。生，亦我所欲也；義，亦我所欲也。二者不可得兼，舍生而取義者也。`;

export default function ClassicalChinesePage() {
  const [text, setText] = useState("");
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeWord, setActiveWord] = useState<string | null>(null);

  async function handleAnalyze() {
    if (!text.trim()) return;
    setLoading(true);
    setError(null);
    setAnnotations([]);
    setActiveWord(null);

    try {
      const res = await fetch(`${basePath}/api/classical-chinese`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "分析失敗，請稍後再試");
      }

      const data = await res.json();
      setAnnotations(data.annotations ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "分析時發生錯誤");
    } finally {
      setLoading(false);
    }
  }

  function handleClear() {
    setAnnotations([]);
    setActiveWord(null);
  }

  // Build maps: position → annotation for tooltips, position → word for highlighting
  const posAnnotation = new Map<number, Annotation>();
  const posWord = new Map<number, string>();
  annotations.forEach((ann) => {
    ann.positions.forEach((pos) => {
      if (!posAnnotation.has(pos)) {
        posAnnotation.set(pos, ann);
        posWord.set(pos, ann.word);
      }
    });
  });

  // Group by word for the sidebar
  const wordGroups: { word: string; count: number; colorIdx: number }[] = [];
  const wordGroupMap = new Map<string, number>(); // word → index in wordGroups
  annotations.forEach((ann) => {
    const existing = wordGroupMap.get(ann.word);
    if (existing !== undefined) {
      wordGroups[existing].count += ann.positions.length;
    } else {
      wordGroupMap.set(ann.word, wordGroups.length);
      wordGroups.push({
        word: ann.word,
        count: ann.positions.length,
        colorIdx: wordGroups.length,
      });
    }
  });

  // Build word → color index for consistent coloring
  const wordColorMap = new Map<string, number>();
  wordGroups.forEach((g, i) => wordColorMap.set(g.word, i));

  // Stats
  const totalHighlighted = new Set(annotations.flatMap((a) => a.positions)).size;

  return (
    <>
      <Header backHref="/chinese" backLabel="返回中文科" />

      <main className="flex flex-1 flex-col px-6 py-8 overflow-y-auto">
        <div className="w-full max-w-5xl mx-auto space-y-8">
          {/* Page header */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center size-14 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-600 text-white shadow-lg mx-auto">
              <ScrollText className="size-7" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight">
              文言文虛詞標註
            </h1>
            <p className="text-base text-muted-foreground max-w-md mx-auto">
              貼上一段文言文，AI 自動幫你標記虛詞並解釋用法 ✨
            </p>
          </div>

          {/* Input area */}
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-950/20 dark:to-violet-950/20">
              <CardTitle className="flex items-center gap-2 text-base">
                <div className="flex size-7 items-center justify-center rounded-lg bg-purple-500 text-white">
                  <Highlighter className="size-3.5" />
                </div>
                輸入文言文
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="在此貼上文言文內容…"
                className="min-h-[140px] text-base leading-relaxed resize-y font-serif"
              />
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  onClick={handleAnalyze}
                  disabled={!text.trim() || loading}
                  className="gap-2 bg-gradient-to-r from-purple-500 to-violet-600 hover:from-purple-600 hover:to-violet-700 shadow-md"
                >
                  {loading ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <Sparkles className="size-4" />
                  )}
                  {loading ? "分析中…" : "AI 標註虛詞"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setText(SAMPLE_TEXT);
                    setAnnotations([]);
                    setActiveWord(null);
                  }}
                  className="gap-1.5"
                >
                  <BookOpen className="size-3.5" />
                  載入範例
                </Button>
                {annotations.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="gap-1 text-muted-foreground"
                  >
                    <Eraser className="size-3.5" />
                    清除標記
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-24" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-4/5" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-6 w-3/5" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-5 w-20" />
                </CardHeader>
                <CardContent className="space-y-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-lg" />
                  ))}
                </CardContent>
              </Card>
            </div>
          )}

          {/* Error */}
          {error && (
            <Card className="border-destructive/50 bg-destructive/5">
              <CardContent className="flex items-center gap-3 pt-4">
                <div className="flex size-8 items-center justify-center rounded-full bg-destructive/10">
                  <span className="text-destructive text-lg">!</span>
                </div>
                <p className="text-sm text-destructive">{error}</p>
              </CardContent>
            </Card>
          )}

          {/* Result: highlighted text + legend */}
          {annotations.length > 0 && !loading && (
            <>
              <div className="flex items-center gap-4 px-1">
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <ScrollText className="size-3" />
                  {wordGroups.length} 個虛詞
                </Badge>
                <Badge variant="secondary" className="gap-1.5 px-3 py-1">
                  <Highlighter className="size-3" />
                  {totalHighlighted} 處標記
                </Badge>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-6">
                {/* Highlighted text */}
                <Card className="overflow-hidden">
                  <CardHeader className="flex-row items-center justify-between bg-muted/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <BookOpen className="size-4 text-primary" />
                      標註結果
                    </CardTitle>
                    {activeWord !== null && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setActiveWord(null)}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        取消篩選
                      </Button>
                    )}
                  </CardHeader>
                  <Separator />
                  <CardContent className="pt-6 pb-8">
                    <TooltipProvider>
                      <p className="text-xl leading-[2.4] tracking-wider font-serif select-text">
                        {Array.from(text).map((char, i) => {
                          const ann = posAnnotation.get(i);
                          const word = posWord.get(i);

                          if (ann && word !== undefined) {
                            const colorIdx = wordColorMap.get(word) ?? 0;
                            const color = COLORS[colorIdx % COLORS.length];
                            const isActive =
                              activeWord === null || activeWord === word;
                            return (
                              <Tooltip key={i}>
                                <TooltipTrigger
                                  onClick={() =>
                                    setActiveWord(
                                      activeWord === word ? null : word
                                    )
                                  }
                                  className={[
                                    "inline-block rounded px-0.5 py-0.5 cursor-pointer transition-all duration-200 font-bold",
                                    "border-b-2 border-current",
                                    color.bg,
                                    color.text,
                                    isActive
                                      ? "opacity-100 scale-100"
                                      : "opacity-20 scale-95",
                                  ].join(" ")}
                                >
                                  {char}
                                </TooltipTrigger>
                                <TooltipContent
                                  side="top"
                                  className="max-w-xs"
                                >
                                  <div className="space-y-1">
                                    <div className="font-bold text-sm">
                                      「{ann.word}」{ann.partOfSpeech}
                                    </div>
                                    <Separator className="opacity-30" />
                                    <div className="text-xs leading-relaxed">
                                      {ann.meaning}
                                    </div>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            );
                          }

                          return (
                            <span
                              key={i}
                              className={[
                                "transition-opacity duration-200",
                                activeWord !== null ? "opacity-40" : "",
                              ].join(" ")}
                            >
                              {char}
                            </span>
                          );
                        })}
                      </p>
                    </TooltipProvider>
                  </CardContent>
                </Card>

                {/* Legend sidebar */}
                <Card className="overflow-hidden lg:self-start">
                  <CardHeader className="bg-muted/30">
                    <CardTitle className="text-base flex items-center gap-2">
                      <List className="size-4 text-primary" />
                      虛詞列表
                    </CardTitle>
                  </CardHeader>
                  <Separator />
                  <CardContent className="p-2">
                    <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
                      {/* "Show all" option */}
                      <button
                        onClick={() => setActiveWord(null)}
                        className={[
                          "w-full flex items-center justify-between rounded-lg px-3 py-2.5 text-sm transition-all",
                          activeWord === null
                            ? "bg-primary/10 font-semibold text-primary"
                            : "hover:bg-muted/60 text-foreground",
                        ].join(" ")}
                      >
                        <span>顯示全部</span>
                        <Badge
                          variant={
                            activeWord === null ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {totalHighlighted}
                        </Badge>
                      </button>

                      <Separator className="my-1" />

                      {wordGroups.map((group) => {
                        const color =
                          COLORS[group.colorIdx % COLORS.length];
                        const isSelected = activeWord === group.word;
                        return (
                          <button
                            key={group.word}
                            onClick={() =>
                              setActiveWord(isSelected ? null : group.word)
                            }
                            className={[
                              "w-full text-left rounded-lg px-3 py-2.5 transition-all",
                              isSelected
                                ? `${color.activeBg} ring-2 ${color.ring}`
                                : "hover:bg-muted/60",
                            ].join(" ")}
                          >
                            <div className="flex items-center gap-2.5">
                              <span
                                className={[
                                  "inline-flex items-center justify-center size-9 rounded-lg text-base font-bold shrink-0 shadow-sm",
                                  color.bg,
                                  color.text,
                                ].join(" ")}
                              >
                                {group.word}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-xs"
                              >
                                ×{group.count}
                              </Badge>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
}
