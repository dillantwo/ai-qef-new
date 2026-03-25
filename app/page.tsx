"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUp,
  ImagePlus,
  Plus,
  Divide,
  Percent,
  Gauge,
  Variable,
  Clock,
  Hash,
  Grid3X3,
  Box,
  X,
  Loader2,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

const suggestions = [
  { label: "四則運算 Arithmetic", icon: Plus },
  { label: "分數 Fraction", icon: Divide },
  { label: "百分數 Percentage", icon: Percent },
  { label: "速率 Speed", icon: Gauge },
  { label: "代數 Algebra", icon: Variable },
  { label: "時間 Time", icon: Clock },
  { label: "小數 Decimal", icon: Hash },
  { label: "倍數和因數 Factors and Multiples", icon: Grid3X3 },
  { label: "周界/面積/體積 Perimeter/Area/Volume", icon: Box },
];

export default function Home() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canSend = (input.trim() || files) && !isClassifying;

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function doSend() {
    if (!canSend) return;
    setIsClassifying(true);

    try {
      let imageData: string | undefined;
      if (files && files.length > 0) {
        imageData = await fileToBase64(files[0]);
      }

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: input.trim(),
          imageData,
        }),
      });

      if (!res.ok) throw new Error("Classification failed");

      const { type, question } = await res.json();
      sessionStorage.setItem(
        "dashboard-data",
        JSON.stringify({
          type,
          question: question || input.trim() || "（見圖片）",
          imageData,
        })
      );
      router.push(`/dashboard?type=${type}`);
    } catch {
      // Fallback: default to fraction if classification fails
      const q = input.trim() || "（見圖片）";
      sessionStorage.setItem(
        "dashboard-data",
        JSON.stringify({ type: "fraction", question: q })
      );
      router.push("/dashboard?type=fraction");
    } finally {
      setIsClassifying(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    doSend();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      doSend();
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setFiles(e.target.files);
    }
  }

  function removeFile(index: number) {
    if (!files) return;
    const dt = new DataTransfer();
    Array.from(files).forEach((f, i) => {
      if (i !== index) dt.items.add(f);
    });
    if (dt.files.length === 0) {
      setFiles(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } else {
      setFiles(dt.files);
    }
  }

  function handleSuggestionClick(label: string) {
    setInput(label);
    textareaRef.current?.focus();
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const file = items[i].getAsFile();
        if (file) imageFiles.push(file);
      }
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();
    const dt = new DataTransfer();
    if (files) Array.from(files).forEach((f) => dt.items.add(f));
    imageFiles.forEach((f) => dt.items.add(f));
    setFiles(dt.files);
  }

  return (
    <>
      {/* Lightbox overlay */}
      {previewSrc && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 cursor-zoom-out"
          onClick={() => setPreviewSrc(null)}
        >
          <button
            className="absolute top-4 right-4 size-8 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
            onClick={() => setPreviewSrc(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={previewSrc}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Header />

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          {/* Heading */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              請輸入數學題目，AI將為您解答
            </h1>
            <p className="text-muted-foreground">
              這是一個基於AI的數學問題學習平台，您可以在下方輸入任何數學題目。
            </p>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full rounded-xl border border-border bg-background shadow-sm">
              {/* Image preview */}
              {files && files.length > 0 && (
                <div className="flex gap-2 px-4 pt-3 flex-wrap">
                  {Array.from(files).map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="size-16 rounded-lg object-cover border border-border cursor-zoom-in"
                        onClick={() => setPreviewSrc(URL.createObjectURL(file))}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 size-5 rounded-full bg-foreground text-background flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <Textarea
                ref={textareaRef}
                placeholder="輸入數學題目，例如：3/4 + 1/2 = ?（可直接粘貼圖片）"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                disabled={isClassifying}
                className="min-h-[100px] resize-none border-0 bg-transparent px-4 pt-4 pb-12 text-base shadow-none focus-visible:ring-0"
              />

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isClassifying}
                >
                  <ImagePlus className="size-4 text-muted-foreground" />
                </Button>

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-lg"
                  disabled={!canSend}
                >
                  {isClassifying ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <ArrowUp className="size-4" />
                  )}
                </Button>
              </div>
            </div>
          </form>

          {/* Suggestion Tags */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            {suggestions.map(({ label, icon: Icon }) => (
              <Badge
                key={label}
                variant="outline"
                className="cursor-pointer gap-1.5 px-3 py-1.5 text-sm font-normal hover:bg-muted transition-colors"
                onClick={() => handleSuggestionClick(label)}
              >
                <Icon className="size-3.5" />
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
