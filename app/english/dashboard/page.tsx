"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Square,
  Bot,
  User,
  Monitor,
  Smartphone,
  BookOpen,
  Compass,
  MessageSquare,
  Mic,
  MicOff,
  ImagePlus,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { basePath } from "@/lib/utils";
import { DefaultChatTransport } from "ai";
import { getEnglishLocationDirectionPrompt } from "@/lib/english-prompts";

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

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `${basePath}/api/chat`,
      body: () => ({
        systemPrompt: getEnglishLocationDirectionPrompt(selectedTaskRef.current),
      }),
    }),
  });

  const [input, setInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [taskPrompt, setTaskPrompt] = useState<string | null>(null);
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
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
    <div className="flex flex-1 overflow-hidden">
      {/* Left panel: Tasks + HTML Preview */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-4 py-2">
          <div className="flex items-center gap-2">
            <Compass className="size-4 text-primary" />
            <span className="text-sm font-semibold">
              {topic.replace("-", " & ").replace(/\b\w/g, (c) => c.toUpperCase())}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant={viewMode === "desktop" ? "outline" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("desktop")}
            >
              <Monitor className="size-4" />
            </Button>
            <Button
              variant={viewMode === "mobile" ? "outline" : "ghost"}
              size="icon-sm"
              onClick={() => setViewMode("mobile")}
            >
              <Smartphone className="size-4" />
            </Button>
          </div>
        </div>

        {/* Task bar + prompt */}
        <div className="px-4 py-3 border-b border-border space-y-3">
          {/* Task pills */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
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
                      ? "h-7 px-3 text-xs"
                      : "h-7 px-3 text-xs"
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
            <Card size="sm" className="border-2 border-blue-400 bg-blue-50 ring-0 shadow-md dark:bg-blue-950/40 dark:border-blue-500">
              <CardContent className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500 mt-0.5 shadow-sm">
                  <BookOpen className="size-4 text-white" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-blue-900 dark:text-blue-100">
                  {taskPrompt}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* HTML Preview */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          <div
            className={`h-full mx-auto rounded-xl border border-border bg-white transition-all ${
              viewMode === "mobile" ? "max-w-[390px]" : "w-full"
            }`}
          >
            <iframe
              src={previewSrc}
              className="h-full w-full rounded-xl"
              sandbox="allow-scripts allow-same-origin"
              title="HTML Preview"
            />
          </div>
        </div>
      </div>

      {/* Right panel: AI Chat */}
      <div className="relative flex w-[360px] shrink-0 flex-col border-l border-[#d8d8d8] min-h-0 bg-white/95">
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
            <Badge className="rounded-[4px] border-0 bg-[#146ef5]/10 px-2 py-1 text-[10px] font-semibold uppercase tracking-[1px] text-[#146ef5]">
              Live
            </Badge>
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
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[#146ef5] text-white shadow-[2px_2px_0px_#080808]">
                  <Bot className="size-4" strokeWidth={2} />
                </div>
              )}
              <div
                className={`prose prose-sm max-w-none max-w-[85%] rounded-[8px] border px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "border-[#146ef5] bg-[#146ef5] text-white prose-invert"
                    : "border-[#d8d8d8] bg-white text-[#080808] prose-neutral"
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
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[[rehypeKatex, { strict: false }]]}
                    >
                      {part.text}
                    </ReactMarkdown>
                  ))}
              </div>
              {message.role === "user" && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] border border-[#d8d8d8] bg-[#f7f7f7] text-[#4f4f4f]">
                  <User className="size-4" strokeWidth={2} />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex items-start gap-2 justify-start">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[4px] bg-[#146ef5] text-white shadow-[2px_2px_0px_#080808]">
                <Bot className="size-4" strokeWidth={2} />
              </div>
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
    </div>
  );
}
