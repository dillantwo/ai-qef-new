"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Square,
  BookOpen,
  Compass,
  MessageSquare,
  Mic,
  MicOff,
  ImagePlus,
  X,
  ChevronLeft,
  PanelRight,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ChatAvatar } from "@/components/ChatAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { basePath } from "@/lib/utils";
import { DefaultChatTransport } from "ai";
import { getEnglishLocationDirectionPrompt } from "@/lib/english-prompts";
import {
  createEnglishChatId,
  serializeUiMessages,
  restoreUiMessages,
  upsertEnglishChatHistory,
  type EnglishChatHistoryItem,
} from "@/lib/english-chat-history";

// Map topic to its preview HTML file
const previewMap: Record<string, string> = {
  "location-direction": `${basePath}/english/preview-location-direction.html`,
};

const tasks = [
  { id: 1, label: "Task 1", prompt: "Let us start Task 1. Look at the map. How can I go from [A] to [B]? Use prepositional phrases to describe the direction." },
  { id: 2, label: "Task 2", prompt: "Let us start Task 2. Look at the map. How can I go from [A] to [B]? Write short sentences with the prepositional phrases you learned." },
  { id: 3, label: "Task 3", prompt: "Let us start Task 3. Look at the map. How can I go from [A] to [B]? Write more than one sentence and use linking words (First, Then, After that, Finally)." },
  { id: 4, label: "Task 4", prompt: "Let us start Task 4. Look at the map. How can I go from [A] to [B]? Write a complete paragraph with a topic sentence and linking words." },
  { id: 5, label: "Task 5", prompt: "Let us start Task 5. Can you read my map? Please: 1) Draw a map of the neighborhood from your home to school. 2) Upload your drawing to the chatbot." },
];

export default function EnglishDashboardPage() {
  return (
    <Suspense>
      <EnglishDashboardContent />
    </Suspense>
  );
}

function EnglishDashboardContent() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "location-direction";

  // Keep the current task id in a ref so the transport's body resolver always
  // sees the latest selection without recreating the transport.
  const selectedTaskRef = useRef<number | null>(null);

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `${basePath}/api/chat`,
      body: () => ({
        systemPrompt: getEnglishLocationDirectionPrompt(selectedTaskRef.current),
      }),
    }),
  });

  const [input, setInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);

  const [taskPrompt, setTaskPrompt] = useState<string | null>(null);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const [chatVisible, setChatVisible] = useState(true);
  const [currentChatId, setCurrentChatId] = useState(() => createEnglishChatId());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    selectedTaskRef.current = selectedTask;
  }, [selectedTask]);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = (!!input.trim() || chatFiles.length > 0) && !isLoading;

  const previewSrc = previewMap[topic] || `${basePath}/english/preview-location-direction.html`;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  const handleNewChat = useCallback(() => {
    setCurrentChatId(createEnglishChatId());
    setMessages([]);
    setInput("");
    setChatFiles([]);
    setSelectedTask(null);
    setTaskPrompt(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    setChatVisible(true);
  }, [setMessages]);

  // Listen for sidebar "New Chat" button
  useEffect(() => {
    function onNewChat() {
      handleNewChat();
    }
    window.addEventListener("dashboard:new-chat", onNewChat);
    return () => window.removeEventListener("dashboard:new-chat", onNewChat);
  }, [handleNewChat]);

  // Listen for sidebar history item click
  useEffect(() => {
    function onLoadChat(event: Event) {
      const detail = (event as CustomEvent<{ item: EnglishChatHistoryItem }>).detail?.item;
      if (!detail) return;
      setCurrentChatId(detail.id);
      setMessages(restoreUiMessages(detail.messages));
      setSelectedTask(detail.selectedTask ?? null);
      setTaskPrompt(
        detail.selectedTask
          ? tasks.find((t) => t.id === detail.selectedTask)?.prompt ?? null
          : null
      );
      setInput("");
      setChatFiles([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
      setChatVisible(true);
    }
    window.addEventListener("english-chat:load", onLoadChat);
    return () => window.removeEventListener("english-chat:load", onLoadChat);
  }, [setMessages]);

  // Auto-save chat history
  useEffect(() => {
    if (messages.length === 0) return;
    if (status === "streaming" || status === "submitted") return;

    const firstUserText = messages
      .filter((m) => m.role === "user")
      .flatMap((m) => m.parts)
      .find((p) => p.type === "text" && p.text.trim().length > 0);

    const title = firstUserText?.type === "text"
      ? firstUserText.text.slice(0, 50)
      : "English Chat";

    upsertEnglishChatHistory({
      id: currentChatId,
      title,
      topic,
      selectedTask,
      messages: serializeUiMessages(messages),
      updatedAt: new Date().toISOString(),
    });
  }, [currentChatId, messages, status, topic, selectedTask]);

  function stopListening() {
    recognitionRef.current?.stop();
    setIsListening(false);
  }

  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。');
      return;
    }
    if (isListening) { stopListening(); return; }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
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
    const fileParts = await Promise.all(
      chatFiles.map(async (file) => ({
        type: "file" as const,
        mediaType: file.type,
        filename: file.name,
        url: await fileToDataURL(file),
      }))
    );
    sendMessage({ text: input.trim() || "(see image)", ...(fileParts.length > 0 ? { files: fileParts } : {}) });
    setInput("");
    setChatFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files) {
      setChatFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
  }

  function removeChatFile(index: number) {
    setChatFiles((prev) => prev.filter((_, i) => i !== index));
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
    setChatFiles((prev) => [...prev, ...imageFiles]);
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

  return (
    <div className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
      {/* Decorative gradient overlays (same as math dashboard) */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,_#ffffff_0%,_#f7fbff_45%,_#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(20,110,245,0.14),_transparent_48%)]" />

      {/* Left panel: Tasks + HTML Preview */}
      <div className="relative flex min-w-0 flex-1 flex-col border-r border-[#d8d8d8]">
        {/* Top bar */}
        <div className="flex h-[57px] shrink-0 items-center justify-between border-b border-[#d8d8d8] bg-white/95 px-4">
          <div className="flex items-center gap-1">
            <SidebarTrigger />
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="size-4" />
              選科目
            </Link>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <Compass className="size-4 text-[#146ef5]" />
              <span className="text-sm font-semibold text-[#080808]">
                {topic.replace("-", " & ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </span>
            </div>
            {!chatVisible && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setChatVisible(true)}
                className="rounded-[4px] border border-[#d8d8d8] bg-white/90 shadow-sm backdrop-blur ml-3"
                title="顯示 AI 助手"
              >
                <PanelRight className="size-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Task bar + prompt */}
        <div className="px-4 py-3 border-b border-[#d8d8d8] space-y-3">
          {/* Task pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#ababab]">
              Tasks
            </span>
            <Separator orientation="vertical" className="h-4" />
            <div className="flex gap-1.5">
              {tasks.map(({ id, label, prompt }) => (
                <Button
                  key={id}
                  variant={selectedTask === id ? "default" : "outline"}
                  size="sm"
                  className={
                    selectedTask === id
                      ? "h-7 px-3 text-xs rounded-[4px] bg-[#146ef5] text-white hover:bg-[#0055d4]"
                      : "h-7 px-3 text-xs rounded-[4px] border-[#d8d8d8]"
                  }
                  onClick={() => {
                    setSelectedTask(id);
                    setTaskPrompt(prompt || null);
                  }}
                >
                  {label}
                </Button>
              ))}
            </div>
          </div>

          {/* Task prompt card */}
          {taskPrompt && (
            <Card className="rounded-[8px] border-2 border-[#146ef5]/30 bg-[#146ef5]/5 ring-0 shadow-md">
              <CardContent className="flex items-start gap-3 p-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-[4px] bg-[#146ef5] mt-0.5 shadow-sm">
                  <BookOpen className="size-4 text-white" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-[#080808]">
                  {taskPrompt}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* HTML Preview */}
        <div className="flex-1 overflow-auto p-4 bg-transparent">
          <div
            className="h-full mx-auto w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px] transition-all"
          >
            <iframe
              src={previewSrc}
              className="h-full w-full rounded-[8px]"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </div>
      </div>

      {/* Right panel: AI Chat */}
      {chatVisible && (
        <div className="relative flex w-[360px] shrink-0 flex-col min-h-0 bg-white/95">
          <div className="border-b border-[#d8d8d8] px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#146ef5] text-white">
                  <MessageSquare className="size-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#ababab]">English assistant</p>
                  <p className="text-sm font-semibold text-[#080808]">AI Chatbot</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={handleNewChat}
                  className="rounded-[4px] border border-transparent bg-[#146ef5] px-2.5 text-xs font-semibold text-white shadow-[0_6px_16px_rgba(20,110,245,0.28)] transition-all hover:bg-[#0055d4] hover:shadow-[0_8px_20px_rgba(0,85,212,0.34)]"
                  title="New Chat"
                >
                  New Chat
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setChatVisible(false)}
                  className="rounded-[4px]"
                  title="隱藏 AI 助手"
                >
                  <PanelRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Chat messages */}
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 min-h-0 bg-[linear-gradient(180deg,_rgba(20,110,245,0.03)_0%,_rgba(255,255,255,1)_35%)]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex items-start gap-2 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {message.role === "assistant" && (
                  <ChatAvatar
                    role="assistant"
                    className="h-8 w-8 rounded-[4px] shadow-[2px_2px_0px_#080808]"
                  />
                )}
                <div
                  className={`min-w-0 max-w-[85%] rounded-[8px] px-3 py-2 text-sm leading-relaxed shadow-[2px_2px_0px_#080808] ${
                    message.role === "user"
                      ? "bg-[#146ef5] text-white"
                      : "border border-[#d8d8d8] bg-white text-[#080808]"
                  }`}
                >
                  {message.parts.some((p) => p.type === "file") && (
                    <div className="flex flex-wrap gap-1.5 mb-1.5 not-prose">
                      {message.parts
                        .filter((p): p is { type: "file"; mediaType: string; url: string; filename?: string } => p.type === "file" && p.mediaType.startsWith("image/"))
                        .map((filePart, i) => (
                          <img
                            key={i}
                            src={filePart.url}
                            alt={filePart.filename ?? "uploaded image"}
                            className="max-w-[200px] max-h-[200px] rounded-[4px] border border-white/30 object-contain"
                          />
                        ))}
                    </div>
                  )}
                  {message.parts
                    .filter((part): part is { type: "text"; text: string } => part.type === "text")
                    .map((part, i) => (
                      message.role === "assistant" ? (
                        <div
                          key={i}
                          className="prose prose-sm max-w-none break-words prose-p:my-2 prose-li:my-1 prose-headings:my-2 [overflow-wrap:anywhere] [&_.katex-display]:max-w-full [&_.katex-display]:overflow-x-auto [&_.katex-display]:overflow-y-hidden [&_pre]:max-w-full [&_pre]:overflow-x-auto [&_code]:break-words [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#d8d8d8] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#f7f7f7] [&_td]:border [&_td]:border-[#d8d8d8] [&_td]:px-2 [&_td]:py-1"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[[rehypeKatex, { strict: false }]]}
                          >
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <div
                          key={i}
                          className="prose prose-sm max-w-none break-words prose-invert [overflow-wrap:anywhere]"
                        >
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm, remarkMath]}
                            rehypePlugins={[[rehypeKatex, { strict: false }]]}
                          >
                            {part.text}
                          </ReactMarkdown>
                        </div>
                      )
                    ))}
                </div>
                {message.role === "user" && (
                  <ChatAvatar
                    role="user"
                    className="h-8 w-8 rounded-[4px] border border-[#d8d8d8] bg-white"
                  />
                )}
              </div>
            ))}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex items-start gap-2 justify-start">
                <ChatAvatar
                  role="assistant"
                  className="h-8 w-8 rounded-[4px] shadow-[2px_2px_0px_#080808]"
                />
                <div className="rounded-[8px] border border-[#d8d8d8] bg-white px-3 py-2 text-sm text-[#5a5a5a]">
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat input */}
          <div className="border-t border-[#d8d8d8] px-3 py-3 bg-white">
            <form onSubmit={handleSubmit}>
              <div className="relative w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]">
                {/* Image preview thumbnails */}
                {chatFiles.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                    {chatFiles.map((file, i) => (
                      <div key={i} className="relative group">
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="size-12 rounded-[4px] border border-[#d8d8d8] object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeChatFile(i)}
                          className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-[#080808] text-white opacity-0 transition-opacity group-hover:opacity-100"
                        >
                          <X className="size-2.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <Textarea
                  ref={textareaRef}
                  placeholder="Ask a question... (paste images allowed)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onPaste={handlePaste}
                  className="min-h-[58px] max-h-[160px] resize-none overflow-y-auto border-0 bg-transparent px-3 pt-3 pb-10 text-sm shadow-none focus-visible:ring-0"
                />

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleChatFileChange}
                  className="hidden"
                />

                <div className="absolute bottom-1.5 left-1.5 right-1.5 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-[4px] border border-[#d8d8d8] bg-white text-[#080808] transition-all hover:border-[#898989] hover:bg-white"
                      title="Upload image"
                    >
                      <ImagePlus className="size-3.5 text-[#5a5a5a]" />
                    </Button>
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="ghost"
                      onClick={toggleVoice}
                      className={`rounded-[4px] border bg-white transition-all hover:bg-white ${
                        isListening
                          ? 'border-red-400 text-red-500 hover:border-red-500 hover:text-red-600'
                          : 'border-[#d8d8d8] text-[#080808] hover:border-[#898989] hover:text-[#080808]'
                      }`}
                      title={isListening ? 'Stop voice input' : 'Voice input'}
                    >
                      {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-[#5a5a5a]" />}
                    </Button>
                    {isListening && (
                      <span className="text-[11px] font-medium text-red-500 animate-pulse">Listening…</span>
                    )}
                  </div>
                  {isLoading ? (
                    <Button
                      type="button"
                      size="icon-sm"
                      variant="outline"
                      className="rounded-[4px]"
                      onClick={stop}
                    >
                      <Square className="size-3" />
                    </Button>
                  ) : (
                    <Button
                      type="submit"
                      size="icon-sm"
                      className="rounded-[4px] bg-[#146ef5] text-white hover:bg-[#0055d4]"
                      disabled={!canSend}
                    >
                      <ArrowUp className="size-3.5" />
                    </Button>
                  )}
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
