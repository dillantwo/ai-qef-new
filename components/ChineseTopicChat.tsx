"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Mic,
  MicOff,
  ImagePlus,
  X,
  ChevronLeft,
  PenTool,
  BookOpen,
  Sparkles,
  Copy,
  Check,
  Pin,
  PinOff,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { basePath } from "@/lib/utils";
import {
  createChineseChatId,
  upsertChineseChatHistory,
  type ChineseChatHistoryItem,
  type SavedChatMessage,
} from "@/lib/chinese-chat-history";

export interface ChineseTopicConfig {
  /** Stable identifier used for chat-history storage and load filtering. */
  topicId: string;
  /** Human-readable label shown in the header. */
  topicLabel: string;
  /** Prefix used when generating a session id. */
  sessionPrefix: string;
  /** API route this topic talks to (system prompt lives on the server). */
  apiEndpoint: string;
  /** Optional header icon name (defaults to "pen"). Passed as a string so the
   *  config can cross the Server -> Client Component boundary. */
  icon?: "pen" | "book";
  /** Optional textarea placeholder. */
  placeholder?: string;
  /** Optional hint shown when the conversation is empty. */
  emptyHint?: string;
  /** Optional default title used for history entries. */
  defaultTitle?: string;
}

type ChatImage = { mediaType: string; dataUrl: string; filename?: string };
type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: ChatImage[];
};

const ICON_MAP: Record<NonNullable<ChineseTopicConfig["icon"]>, LucideIcon> = {
  pen: PenTool,
  book: BookOpen,
};

export default function ChineseTopicChat({ config }: { config: ChineseTopicConfig }) {
  const {
    topicId,
    topicLabel,
    sessionPrefix,
    apiEndpoint,
    icon = "pen",
    placeholder = "輸入你的作文或問題…",
    emptyHint = `開始與 AI 對話，練習${config.topicLabel}。`,
    defaultTitle = `${config.topicLabel}對話`,
  } = config;
  const HeaderIcon = ICON_MAP[icon];

  const makeSessionId = useCallback(
    () =>
      `${sessionPrefix}-${
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      }`,
    [sessionPrefix]
  );

  const [sessionId, setSessionId] = useState<string>(() => makeSessionId());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const [input, setInput] = useState("");
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [currentChatId, setCurrentChatId] = useState(() => createChineseChatId());
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);
  const [showPinned, setShowPinned] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = (!!input.trim() || chatFiles.length > 0) && !isLoading;
  const pinnedMessages = messages.filter((m) => pinnedIds.includes(m.id));

  useEffect(() => {
    setSessionId(makeSessionId());
  }, [makeSessionId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  const handleCopy = useCallback(async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for browsers/contexts without clipboard API
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      try { document.execCommand("copy"); } catch { /* ignore */ }
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2000);
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      if (next.length > 0) setShowPinned(true);
      return next;
    });
  }, []);

  const handleNewChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setMessages([]);
    setInput("");
    setChatFiles([]);
    setStatus("idle");
    setSessionId(makeSessionId());
    setCurrentChatId(createChineseChatId());
    setPinnedIds([]);
    setShowPinned(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [makeSessionId]);

  useEffect(() => {
    window.addEventListener("dashboard:new-chat", handleNewChat);
    return () => window.removeEventListener("dashboard:new-chat", handleNewChat);
  }, [handleNewChat]);

  // Listen for sidebar history item click
  useEffect(() => {
    function onLoadChat(event: Event) {
      const detail = (event as CustomEvent<{ item: ChineseChatHistoryItem }>).detail?.item;
      if (!detail || detail.topic !== topicId) return;
      abortRef.current?.abort();
      abortRef.current = null;
      setCurrentChatId(detail.id);
      const restored: ChatMsg[] = detail.messages.map((m) => ({
        id: m.id,
        role: m.role as "user" | "assistant",
        text: m.parts.find((p) => p.type === "text")?.text ?? "",
        images: m.parts
          .filter((p) => p.type === "file")
          .map((p) => ({ mediaType: p.mediaType ?? "", dataUrl: p.url ?? "", filename: p.filename })),
      }));
      setMessages(restored);
      setInput("");
      setChatFiles([]);
      setStatus("idle");
      setPinnedIds([]);
      setShowPinned(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
    window.addEventListener("chinese-chat:load", onLoadChat);
    return () => window.removeEventListener("chinese-chat:load", onLoadChat);
  }, [topicId]);

  // Auto-save chat history
  useEffect(() => {
    if (messages.length === 0) return;
    if (status === "streaming" || status === "submitted") return;

    const firstUserText = messages.find((m) => m.role === "user")?.text;
    const title = firstUserText ? firstUserText.slice(0, 50) : defaultTitle;

    const savedMessages: SavedChatMessage[] = messages.map((m) => ({
      id: m.id,
      role: m.role,
      parts: [
        ...(m.text ? [{ type: "text" as const, text: m.text }] : []),
        ...(m.images ?? []).map((img) => ({ type: "file" as const, url: img.dataUrl, mediaType: img.mediaType, filename: img.filename })),
      ],
    }));

    void upsertChineseChatHistory({
      id: currentChatId,
      title,
      topic: topicId,
      messages: savedMessages,
      updatedAt: new Date().toISOString(),
    });
  }, [currentChatId, messages, status, topicId, defaultTitle]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。");
      return;
    }
    if (isListening) { stopListening(); return; }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "zh-HK";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript);
    };
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  async function doSend() {
    if (!canSend) return;
    if (isListening) stopListening();

    const images: ChatImage[] = await Promise.all(
      chatFiles.map(async (file) => ({
        mediaType: file.type,
        dataUrl: await fileToDataURL(file),
        filename: file.name,
      }))
    );

    const userText = input.trim() || "（見圖片）";
    const userMsg: ChatMsg = { id: `u-${Date.now()}`, role: "user", text: userText, ...(images.length > 0 ? { images } : {}) };
    const assistantMsg: ChatMsg = { id: `a-${Date.now()}`, role: "assistant", text: "" };

    const nextMessages = [...messages, userMsg];
    setMessages([...nextMessages, assistantMsg]);
    setInput("");
    setChatFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setStatus("submitted");

    const controller = new AbortController();
    abortRef.current = controller;

    const payloadMessages = nextMessages.map((message) => ({
      role: message.role,
      text: message.text,
      ...(message.images && message.images.length > 0
        ? { images: message.images.map((image) => ({ mediaType: image.mediaType, data: image.dataUrl })) }
        : {}),
    }));

    try {
      const res = await fetch(`${basePath}${apiEndpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages, sessionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, text: `（出錯了）${errText || res.statusText}` } : m));
        setStatus("idle");
        abortRef.current = null;
        return;
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let target = "";
      let displayed = "";
      let streamDone = false;
      let rafId: number | null = null;
      const CHARS_PER_TICK = 2;

      const tick = () => {
        if (displayed.length < target.length) {
          const remaining = target.length - displayed.length;
          const step = Math.max(CHARS_PER_TICK, Math.ceil(remaining / 30));
          displayed = target.slice(0, displayed.length + step);
          const snapshot = displayed;
          setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, text: snapshot } : m));
        }
        if (displayed.length < target.length || !streamDone) {
          rafId = requestAnimationFrame(tick);
        } else {
          rafId = null;
        }
      };
      rafId = requestAnimationFrame(tick);

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          if (chunk) target += chunk;
        }
      } finally {
        streamDone = true;
        await new Promise<void>((resolve) => {
          const waitForCatchUp = () => {
            if (displayed.length >= target.length) {
              if (rafId !== null) cancelAnimationFrame(rafId);
              setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, text: target } : m));
              resolve();
            } else {
              requestAnimationFrame(waitForCatchUp);
            }
          };
          waitForCatchUp();
        });
      }
    } catch (error) {
      if ((error as Error).name !== "AbortError") {
        setMessages((prev) => prev.map((m) => m.id === assistantMsg.id ? { ...m, text: error instanceof Error ? `（出錯了）${error.message}` : "（出錯了）未知錯誤" } : m));
      } else {
        setMessages((prev) => prev.filter((m) => m.id !== assistantMsg.id || m.text));
      }
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }

  function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) setChatFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  }
  function removeChatFile(index: number) {
    setChatFiles((prev) => prev.filter((_, i) => i !== index));
  }
  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) { const f = items[i].getAsFile(); if (f) imageFiles.push(f); }
    }
    if (imageFiles.length === 0) return;
    e.preventDefault();
    setChatFiles((prev) => [...prev, ...imageFiles]);
  }
  function handleSubmit(e: React.FormEvent) { e.preventDefault(); void doSend(); }
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void doSend(); }
  }

  return (
    <div className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
      {/* Full-width chat panel */}
      <div className="relative flex min-w-0 flex-1 flex-col">
        {/* Top bar */}
        <div className="flex h-[57px] shrink-0 items-center justify-between border-b border-[#ededed] bg-white px-4">
          <div className="flex items-center gap-1">
            <SidebarTrigger />
            <Link
              href="/chinese"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
              返回中文科
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <HeaderIcon className="size-4 text-[#146ef5]" />
            <span className="text-sm font-semibold text-[#080808]">{topicLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            {pinnedIds.length > 0 && (
              <Button type="button" variant="outline" size="sm" onClick={() => setShowPinned((v) => !v)}
                className={`rounded-full border-[#e5e5e5] px-3 text-xs font-medium transition-all hover:bg-[#f4f4f5] ${showPinned ? "text-[#146ef5] border-[#146ef5]/40" : "text-[#080808]"}`}
                title={showPinned ? "隱藏釘選" : "顯示釘選"}>
                <Pin className="size-3.5" />
                釘選 {pinnedIds.length}
              </Button>
            )}
            <Button type="button" variant="outline" size="sm" onClick={handleNewChat}
              className="rounded-full border-[#e5e5e5] px-3 text-xs font-medium text-[#080808] transition-all hover:bg-[#f4f4f5]"
              title="New Chat">
              New Chat
            </Button>
          </div>
        </div>

        {/* Chat messages */}
        <div className={`flex-1 px-4 py-6 min-h-0 bg-white ${messages.length > 0 ? "overflow-y-auto" : "overflow-hidden"}`}>
          <div className="w-full space-y-6">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-[#9a9a9a]">
              {emptyHint}
            </div>
          )}
          {messages.map((message) => (
            message.role === "user" ? (
              <div key={message.id} className="flex flex-col items-end">
                <div className="min-w-0 max-w-[80%] rounded-2xl bg-[#f4f4f5] px-4 py-2.5 text-sm leading-relaxed text-[#080808]">
                  {message.images && message.images.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5 not-prose">
                      {message.images.map((image, idx) => (
                        <img key={idx} src={image.dataUrl} alt={image.filename ?? "uploaded image"} className="max-w-[200px] max-h-[200px] rounded-[8px] object-contain" />
                      ))}
                    </div>
                  )}
                  <div className="prose prose-sm max-w-none break-words [overflow-wrap:anywhere]">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
                {message.text && (
                  <div className="flex items-center gap-0.5">
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.text)}
                      className="group/copy relative mt-1.5 inline-flex size-8 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f4f4f5] hover:text-[#5a5a5a]"
                      aria-label="複製訊息"
                    >
                      {copiedId === message.id ? (
                        <Check className="size-4 text-[#16a34a]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-[#080808] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/copy:opacity-100">
                        {copiedId === message.id ? "已複製" : "複製訊息"}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => togglePin(message.id)}
                      className={`group/pin relative mt-1.5 inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[#f4f4f5] ${pinnedIds.includes(message.id) ? "text-[#146ef5]" : "text-[#9a9a9a] hover:text-[#5a5a5a]"}`}
                      aria-label={pinnedIds.includes(message.id) ? "取消釘選" : "釘選訊息"}
                    >
                      {pinnedIds.includes(message.id) ? (
                        <PinOff className="size-4" />
                      ) : (
                        <Pin className="size-4" />
                      )}
                      <span className="pointer-events-none absolute right-0 top-full z-10 mt-1 whitespace-nowrap rounded-md bg-[#080808] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/pin:opacity-100">
                        {pinnedIds.includes(message.id) ? "取消釘選" : "釘選訊息"}
                      </span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div key={message.id} className="flex items-start gap-3">
                {message.text ? (
                  <Sparkles className="mt-1 size-5 shrink-0 text-[#146ef5]" />
                ) : (
                  <span className="relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center">
                    <span className="absolute inset-0 rounded-full border-2 border-[#146ef5]/20 border-t-[#146ef5] animate-spin" />
                    <Sparkles className="size-3.5 text-[#146ef5]" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  {message.text && (
                    <div className="prose prose-sm max-w-none break-words prose-p:my-2 prose-li:my-1 prose-headings:my-2 [overflow-wrap:anywhere] [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#e5e5e5] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#fafafa] [&_td]:border [&_td]:border-[#e5e5e5] [&_td]:px-2 [&_td]:py-1">
                      <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>
                        {message.text}
                      </ReactMarkdown>
                    </div>
                  )}
                  {message.text && !(isLoading && message.id === messages[messages.length - 1]?.id) && (
                    <button
                      type="button"
                      onClick={() => handleCopy(message.id, message.text)}
                      className="group/copy relative mt-1.5 inline-flex size-8 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f4f4f5] hover:text-[#5a5a5a]"
                      aria-label="複製回覆"
                    >
                      {copiedId === message.id ? (
                        <Check className="size-4 text-[#16a34a]" />
                      ) : (
                        <Copy className="size-4" />
                      )}
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#080808] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/copy:opacity-100">
                        {copiedId === message.id ? "已複製" : "複製回覆"}
                      </span>
                    </button>
                  )}
                  {message.text && !(isLoading && message.id === messages[messages.length - 1]?.id) && (
                    <button
                      type="button"
                      onClick={() => togglePin(message.id)}
                      className={`group/pin relative mt-1.5 inline-flex size-8 items-center justify-center rounded-full transition-colors hover:bg-[#f4f4f5] ${pinnedIds.includes(message.id) ? "text-[#146ef5]" : "text-[#9a9a9a] hover:text-[#5a5a5a]"}`}
                      aria-label={pinnedIds.includes(message.id) ? "取消釘選" : "釘選回覆"}
                    >
                      {pinnedIds.includes(message.id) ? (
                        <PinOff className="size-4" />
                      ) : (
                        <Pin className="size-4" />
                      )}
                      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#080808] px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/pin:opacity-100">
                        {pinnedIds.includes(message.id) ? "取消釘選" : "釘選回覆"}
                      </span>
                    </button>
                  )}
                </div>
              </div>
            )
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-start gap-3">
              <span className="relative mt-0.5 inline-flex size-6 shrink-0 items-center justify-center">
                <span className="absolute inset-0 rounded-full border-2 border-[#146ef5]/20 border-t-[#146ef5] animate-spin" />
                <Sparkles className="size-3.5 text-[#146ef5]" />
              </span>
            </div>
          )}
          <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Chat input */}
        <div className="px-4 pb-4 bg-white">
          <form onSubmit={handleSubmit} className="w-full">
            <div className="relative w-full rounded-2xl border border-[#e5e5e5] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
              {chatFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                  {chatFiles.map((file, i) => (
                    <div key={i} className="relative group">
                      <img src={URL.createObjectURL(file)} alt={file.name} className="size-12 rounded-[8px] border border-[#e5e5e5] object-cover" />
                      <button type="button" onClick={() => removeChatFile(i)} className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#080808] text-white opacity-0 transition-opacity group-hover:opacity-100">
                        <X className="size-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <Textarea ref={textareaRef} placeholder={placeholder} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste}
                className="min-h-[56px] max-h-[160px] resize-none overflow-y-auto border-0 bg-transparent px-4 pt-3.5 pb-10 text-sm shadow-none focus-visible:ring-0" />
              <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleChatFileChange} className="hidden" />
              <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button type="button" size="icon-sm" variant="ghost" onClick={() => fileInputRef.current?.click()}
                    className="rounded-full text-[#5a5a5a] transition-all hover:bg-[#f4f4f5]" title="上傳圖片">
                    <ImagePlus className="size-4" />
                  </Button>
                  <Button type="button" size="icon-sm" variant="ghost" onClick={toggleVoice}
                    className={`rounded-full transition-all ${isListening ? 'text-red-500 hover:bg-red-50' : 'text-[#5a5a5a] hover:bg-[#f4f4f5]'}`}
                    title={isListening ? '停止語音輸入' : '語音輸入'}>
                    {isListening ? <MicOff className="size-4" /> : <Mic className="size-4" />}
                  </Button>
                  {isListening && <span className="text-[11px] font-medium text-red-500 animate-pulse">聆聽中…</span>}
                </div>
                {isLoading ? (
                  <Button type="button" size="icon-sm" variant="default" className="rounded-full bg-[#146ef5] hover:bg-[#0055d4]" onClick={stop}><Square className="size-3" /></Button>
                ) : (
                  <Button type="submit" size="icon-sm" className="rounded-full bg-[#146ef5] text-white hover:bg-[#0055d4] disabled:bg-[#d8d8d8]" disabled={!canSend}><ArrowUp className="size-4" /></Button>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Right-side pinned panel */}
      {showPinned && (
        <div className="flex w-80 shrink-0 flex-col border-l border-[#ededed] bg-[#fafafa]">
          <div className="flex h-[57px] shrink-0 items-center justify-between border-b border-[#ededed] bg-white px-4">
            <div className="flex items-center gap-2">
              <Pin className="size-4 text-[#146ef5]" />
              <span className="text-sm font-semibold text-[#080808]">釘選的訊息</span>
            </div>
            <Button type="button" size="icon-sm" variant="ghost" onClick={() => setShowPinned(false)}
              className="rounded-full text-[#5a5a5a] transition-all hover:bg-[#f4f4f5]" title="關閉">
              <X className="size-4" />
            </Button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto p-4">
            {pinnedMessages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center text-xs text-[#9a9a9a]">
                還沒有釘選任何訊息。<br />點擊訊息下方的釘選圖示即可加入。
              </div>
            ) : (
              pinnedMessages.map((message) => (
                <div key={message.id} className="group/pinned rounded-xl border border-[#ededed] bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${message.role === "user" ? "bg-[#f4f4f5] text-[#5a5a5a]" : "bg-[#146ef5]/10 text-[#146ef5]"}`}>
                      {message.role === "user" ? "你" : "AI"}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <button type="button" onClick={() => handleCopy(message.id, message.text)}
                        className="inline-flex size-7 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f4f4f5] hover:text-[#5a5a5a]" title="複製">
                        {copiedId === message.id ? <Check className="size-3.5 text-[#16a34a]" /> : <Copy className="size-3.5" />}
                      </button>
                      <button type="button" onClick={() => togglePin(message.id)}
                        className="inline-flex size-7 items-center justify-center rounded-full text-[#9a9a9a] transition-colors hover:bg-[#f4f4f5] hover:text-[#5a5a5a]" title="取消釘選">
                        <PinOff className="size-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="prose prose-sm max-w-none break-words text-[13px] leading-relaxed [overflow-wrap:anywhere] [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#e5e5e5] [&_th]:px-1.5 [&_th]:py-0.5 [&_td]:border [&_td]:border-[#e5e5e5] [&_td]:px-1.5 [&_td]:py-0.5">
                    <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>
                      {message.text}
                    </ReactMarkdown>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
