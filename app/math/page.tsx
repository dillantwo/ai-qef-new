"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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
  Mic,
  MicOff,
} from "lucide-react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { basePath } from "@/lib/utils";

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

const suggestionAccents = [
  "#146ef5",
  "#7a3dff",
  "#ed52cb",
  "#00d722",
  "#ff6b00",
  "#ffae13",
  "#ee1d36",
  "#3b89ff",
  "#006acc",
];

export default function MathPage() {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<FileList | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const canSend = !!(input.trim() || files) && !isClassifying;

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'zh-HK';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  async function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function doSend() {
    if (!canSend) return;
    stopListening();
    setIsClassifying(true);

    try {
      let imageData: string | undefined;
      if (files && files.length > 0) {
        imageData = await fileToBase64(files[0]);
      }

      const res = await fetch(`${basePath}/api/classify`, {
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
      router.push(`/math/dashboard?type=${type}`);
    } catch {
      // Fallback: default to fraction if classification fails
      const q = input.trim() || "（見圖片）";
      sessionStorage.setItem(
        "dashboard-data",
        JSON.stringify({ type: "fraction", question: q })
      );
      router.push("/math/dashboard?type=fraction");
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
          className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70"
          onClick={() => setPreviewSrc(null)}
        >
          <button
            className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white text-[#080808] transition-colors hover:bg-white/85"
            onClick={() => setPreviewSrc(null)}
          >
            <X className="size-5" />
          </button>
          <img
            src={previewSrc}
            alt="Preview"
            className="max-h-[90vh] max-w-[90vw] rounded-[8px] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      <Header backHref="/" backLabel="選科目" />

      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden bg-white px-4 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_right,rgba(8,8,8,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(8,8,8,0.03)_1px,transparent_1px)] before:bg-[size:28px_28px] before:content-[''] after:pointer-events-none after:absolute after:-top-24 after:left-1/2 after:h-[340px] after:w-[660px] after:-translate-x-1/2 after:bg-[radial-gradient(circle_at_center,rgba(20,110,245,0.18),transparent_68%)] after:content-['']">
        <div className="flex w-full max-w-2xl flex-col items-center gap-8">
          {/* Heading */}
          <div className="space-y-2 text-center">
            <h1 className="text-[clamp(2rem,4.4vw,3.6rem)] font-semibold leading-[1.05] tracking-[-0.032em] text-[#080808]">
              請輸入數學題目，AI將為您解答
            </h1>
            <p className="text-[16px] font-medium leading-[1.6] tracking-[-0.01em] text-[#5a5a5a]">
              這是一個基於AI的數學問題學習平台，您可以在下方輸入任何數學題目。
            </p>
          </div>

          {/* Input Area */}
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[0px_84px_24px_rgba(0,0,0,0),0px_54px_22px_rgba(0,0,0,0.01),0px_30px_18px_rgba(0,0,0,0.04),0px_13px_13px_rgba(0,0,0,0.08),0px_3px_7px_rgba(0,0,0,0.09)] transition-all before:pointer-events-none before:absolute before:left-0 before:right-0 before:top-0 before:h-px before:bg-gradient-to-r before:from-transparent before:via-[#146ef5]/55 before:to-transparent before:content-[''] focus-within:border-[#146ef5] focus-within:shadow-[0px_84px_24px_rgba(0,0,0,0),0px_54px_22px_rgba(0,0,0,0.015),0px_30px_18px_rgba(20,110,245,0.09),0px_13px_13px_rgba(20,110,245,0.14),0px_3px_7px_rgba(20,110,245,0.2)]">
              {/* Image preview */}
              {files && files.length > 0 && (
                <div className="flex flex-wrap gap-2 px-4 pt-3">
                  {Array.from(files).map((file, i) => (
                    <div key={i} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="size-16 cursor-zoom-in rounded-[4px] border border-[#d8d8d8] object-cover"
                        onClick={() => setPreviewSrc(URL.createObjectURL(file))}
                      />
                      <button
                        type="button"
                        onClick={() => removeFile(i)}
                        className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#080808] text-white opacity-0 transition-opacity group-hover:opacity-100"
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
                className="min-h-[100px] resize-none border-0 bg-transparent px-4 pt-4 pb-12 text-[16px] font-medium leading-[1.6] tracking-[-0.01em] text-[#080808] shadow-none placeholder:text-[#ababab] focus-visible:ring-0"
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
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isClassifying}
                    className="rounded-[4px] border border-[#d8d8d8] bg-white text-[#080808] transition-all hover:translate-x-[2px] hover:border-[#898989] hover:bg-white hover:text-[#080808]"
                  >
                    <ImagePlus className="size-4 text-[#5a5a5a]" />
                  </Button>

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={toggleVoice}
                    disabled={isClassifying}
                    className={`rounded-[4px] border bg-white transition-all hover:translate-x-[2px] hover:bg-white ${
                      isListening
                        ? 'border-red-400 text-red-500 hover:border-red-500 hover:text-red-600'
                        : 'border-[#d8d8d8] text-[#080808] hover:border-[#898989] hover:text-[#080808]'
                    }`}
                  >
                    {isListening ? (
                      <MicOff className="size-4" />
                    ) : (
                      <Mic className="size-4 text-[#5a5a5a]" />
                    )}
                  </Button>
                  {isListening && (
                    <span className="text-[12px] font-medium text-red-500 animate-pulse">
                      聆聽中…
                    </span>
                  )}
                </div>

                <Button
                  type="submit"
                  size="icon"
                  className="rounded-[4px] border border-transparent bg-[#146ef5] text-white shadow-[0_8px_20px_rgba(20,110,245,0.34)] transition-all hover:translate-x-[6px] hover:bg-[#0055d4] hover:shadow-[0_10px_24px_rgba(20,110,245,0.44)]"
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
            {suggestions.map(({ label, icon: Icon }, index) => (
              <Badge
                key={label}
                variant="outline"
                className="h-auto cursor-pointer gap-1.5 rounded-[4px] border-[#d8d8d8] px-3 py-1.5 text-[12.8px] font-medium leading-[1.2] tracking-[0.04em] text-[#222222] transition-all hover:border-[var(--accent-color)] hover:bg-[var(--accent-soft)]"
                onClick={() => handleSuggestionClick(label)}
                style={
                  {
                    "--accent-color": suggestionAccents[index],
                    "--accent-soft": `${suggestionAccents[index]}1A`,
                  } as React.CSSProperties
                }
              >
                <Icon className="size-3.5 text-[var(--accent-color)]" />
                {label}
              </Badge>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
