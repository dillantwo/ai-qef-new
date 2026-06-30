"use client";

import { useEffect, useState } from "react";
import { BookMarked, Maximize2, Trash2, X } from "lucide-react";
import { SidebarGroup, SidebarGroupLabel } from "@/components/ui/sidebar";

// Words the student drags here are kept in localStorage so the bank survives
// reloads. The drag source is the Vocab-Builder's tagged words in the chat
// (see VocabChip in EnglishReadingComprehensionChat).
const STORAGE_KEY = "english-reading-vocab-bank";

export function VocabBank() {
  const [words, setWords] = useState<string[]>([]);
  const [over, setOver] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [expanded, setExpanded] = useState(false);

  // Load once on mount (client only) to avoid SSR hydration mismatch.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setWords(parsed.filter((w) => typeof w === "string"));
      }
    } catch {
      // ignore malformed storage
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(words));
    } catch {
      // storage may be unavailable; keep the bank in memory only
    }
  }, [words, loaded]);

  function addWord(raw: string) {
    const word = raw.trim();
    if (!word) return;
    setWords((prev) =>
      prev.some((w) => w.toLowerCase() === word.toLowerCase()) ? prev : [...prev, word],
    );
  }

  function removeWord(word: string) {
    setWords((prev) => prev.filter((w) => w !== word));
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel
        render={<button type="button" />}
        onClick={() => setExpanded(true)}
        className="flex w-full cursor-pointer items-center gap-1.5 text-[#146ef5] transition-colors hover:text-[#0b4fc0]"
        title="View all saved words / 查看全部生詞"
      >
        <BookMarked className="size-3.5" />
        Word Bank 生詞庫
        {words.length > 0 && (
          <span className="ml-0.5 rounded-full bg-[#146ef5]/10 px-1.5 text-[10px] font-semibold">
            {words.length}
          </span>
        )}
        <Maximize2 className="ml-auto size-3 opacity-70" />
      </SidebarGroupLabel>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          e.dataTransfer.dropEffect = "copy";
          if (!over) setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          const word =
            e.dataTransfer.getData("application/x-vocab-word") ||
            e.dataTransfer.getData("text/plain");
          addWord(word);
        }}
        className={`mx-1 rounded-xl border-2 border-dashed p-2.5 shadow-sm transition-colors ${
          over
            ? "border-[#146ef5] bg-[#146ef5]/15 ring-2 ring-[#146ef5]/30"
            : "border-[#f59e0b] bg-[#fffbeb]"
        }`}
      >
        {words.length === 0 ? (
          <p className="px-1 py-3 text-center text-[11px] leading-relaxed text-[#b45309]">
            Drag a new word here to save it.
            <br />
            把生詞拖到這裡儲存。
          </p>
        ) : (
          <div className="flex max-h-[4.75rem] flex-wrap content-start gap-1.5 overflow-y-auto">
            {words.map((word) => (
              <span
                key={word}
                className="group inline-flex h-[22px] items-center gap-1 rounded-full border border-[#f59e0b]/40 bg-[#fef3c7] px-2 text-[12px] font-semibold text-[#b45309]"
              >
                {word}
                <button
                  type="button"
                  onClick={() => removeWord(word)}
                  className="text-[#b45309]/60 transition-colors hover:text-[#b91c1c]"
                  title="Remove word"
                  aria-label={`Remove ${word}`}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
      {words.length > 0 && (
        <button
          type="button"
          onClick={() => setWords([])}
          className="mx-1 mt-1.5 inline-flex items-center gap-1 text-[11px] text-muted-foreground transition-colors hover:text-[#b91c1c]"
        >
          <Trash2 className="size-3" /> Clear all
        </button>
      )}

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setExpanded(false)}
        >
          <div
            className="flex max-h-[80vh] w-full max-w-md flex-col rounded-2xl bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#ededed] px-4 py-3">
              <h2 className="flex items-center gap-1.5 text-sm font-semibold text-[#146ef5]">
                <BookMarked className="size-4" />
                Word Bank 生詞庫
                <span className="text-[#9a9a9a]">({words.length})</span>
              </h2>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                className="rounded-md p-1 text-[#5a5a5a] transition-colors hover:bg-[#f0f0f0]"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {words.length === 0 ? (
                <p className="py-8 text-center text-[13px] text-[#9a9a9a]">
                  No saved words yet.
                  <br />
                  還沒有儲存任何生詞。
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {words.map((word) => (
                    <span
                      key={word}
                      className="group inline-flex items-center gap-1 rounded-full border border-[#f59e0b]/40 bg-[#fef3c7] px-3 py-1 text-[13px] font-semibold text-[#b45309]"
                    >
                      {word}
                      <button
                        type="button"
                        onClick={() => removeWord(word)}
                        className="text-[#b45309]/60 transition-colors hover:text-[#b91c1c]"
                        title="Remove word"
                        aria-label={`Remove ${word}`}
                      >
                        <X className="size-3.5" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            {words.length > 0 && (
              <div className="border-t border-[#ededed] px-4 py-3">
                <button
                  type="button"
                  onClick={() => setWords([])}
                  className="inline-flex items-center gap-1 text-[12px] text-muted-foreground transition-colors hover:text-[#b91c1c]"
                >
                  <Trash2 className="size-3.5" /> Clear all
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </SidebarGroup>
  );
}
