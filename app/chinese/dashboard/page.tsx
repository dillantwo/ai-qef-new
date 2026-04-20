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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { basePath } from "@/lib/utils";
import { DefaultChatTransport } from "ai";

// Map topic to its preview HTML file
const previewMap: Record<string, string> = {
  // Add Chinese topic previews here, e.g.:
  // "reading-comprehension": "/chinese/preview-reading.html",
};

const tasks: { id: number; label: string; prompt: string }[] = [
  { id: 1, label: "Task 1", prompt: "" },
  { id: 2, label: "Task 2", prompt: "" },
  { id: 3, label: "Task 3", prompt: "" },
  { id: 4, label: "Task 4", prompt: "" },
  { id: 5, label: "Task 5", prompt: "" },
];

export default function ChineseDashboardPage() {
  return (
    <Suspense>
      <ChineseDashboardContent />
    </Suspense>
  );
}

function ChineseDashboardContent() {
  const searchParams = useSearchParams();
  const topic = searchParams.get("topic") || "";

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: `${basePath}/api/chat` }),
  });

  const [input, setInput] = useState("");
  const [selectedTask, setSelectedTask] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [taskPrompt, setTaskPrompt] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = input.trim() && !isLoading;

  const previewSrc = previewMap[topic] || "";

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function doSend() {
    if (!canSend) return;
    sendMessage({ text: input.trim() });
    setInput("");
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
            <BookOpen className="size-4 text-primary" />
            <span className="text-sm font-semibold">
              {topic.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "中文科"}
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
                  className="h-7 px-3 text-xs"
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
            <Card size="sm" className="border-2 border-orange-400 bg-orange-50 ring-0 shadow-md dark:bg-orange-950/40 dark:border-orange-500">
              <CardContent className="flex items-start gap-3">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-orange-500 mt-0.5 shadow-sm">
                  <BookOpen className="size-4 text-white" />
                </div>
                <p className="text-sm font-medium leading-relaxed text-orange-900 dark:text-orange-100">
                  {taskPrompt}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* HTML Preview */}
        <div className="flex-1 overflow-auto p-4 bg-muted/30">
          {previewSrc ? (
            <div
              className={`h-full mx-auto rounded-xl border border-border bg-white transition-all ${
                viewMode === "mobile" ? "max-w-[390px]" : "w-full"
              }`}
            >
              <iframe
                src={previewSrc}
                className="h-full w-full rounded-xl"
                sandbox="allow-scripts"
                title="HTML Preview"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              請選擇一個任務開始學習
            </div>
          )}
        </div>
      </div>

      {/* Right panel: AI Chat */}
      <div className="flex w-80 shrink-0 flex-col border-l border-border min-h-0">
        {/* Chat messages */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 py-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 ${
                message.role === "user" ? "justify-end" : "justify-start"
              }`}
            >
              {message.role === "assistant" && (
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <Bot className="size-3" />
                </div>
              )}
              <div
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm leading-relaxed prose prose-sm max-w-none ${
                  message.role === "user"
                    ? "bg-primary text-primary-foreground prose-invert"
                    : "bg-muted prose-neutral dark:prose-invert"
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
                          className="max-w-[200px] max-h-[200px] rounded object-contain"
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
                <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted">
                  <User className="size-3" />
                </div>
              )}
            </div>
          ))}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex gap-2 justify-start">
              <div className="flex size-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Bot className="size-3" />
              </div>
              <div className="bg-muted rounded-lg px-3 py-2 text-sm">
                <span className="animate-pulse">思考中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="border-t border-border px-3 py-3">
          <form onSubmit={handleSubmit}>
            <div className="relative w-full rounded-xl border border-border bg-background shadow-sm">
              <Textarea
                ref={textareaRef}
                placeholder="請輸入問題..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[50px] resize-none border-0 bg-transparent px-3 pt-2.5 pb-9 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute bottom-1.5 right-1.5">
                {isLoading ? (
                  <Button
                    type="button"
                    size="icon-sm"
                    variant="outline"
                    className="rounded-lg"
                    onClick={stop}
                  >
                    <Square className="size-3" />
                  </Button>
                ) : (
                  <Button
                    type="submit"
                    size="icon-sm"
                    className="rounded-lg"
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
