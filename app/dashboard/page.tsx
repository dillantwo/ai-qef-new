"use client";

import { Suspense, useRef, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Square,
  Bot,
  User,
  Pencil,
  Plus,
  Minus,
  X,
  Divide,
  ArrowLeft,
  Variable,
  Monitor,
  Smartphone,
  type LucideIcon,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";

// Map icon name (from DB) to actual Lucide component
const iconMap: Record<string, LucideIcon> = {
  Plus, Minus, X, Divide, Variable,
};

interface ToolFromDB {
  key: string;
  label: string;
  sub: string;
  icon: string;
  bg: string;
  iconBg: string;
  border: string;
  hover: string;
  text: string;
}

interface ToolboxConfigFromDB {
  type: string;
  label: string;
  description: string;
  tools: ToolFromDB[];
  isActive: boolean;
}

export default function DashboardPage() {
  return (
    <Suspense>
      <DashboardContent />
    </Suspense>
  );
}

function DashboardContent() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type") || "other";

  // Read data from sessionStorage (set by home page) — must be in useEffect to avoid hydration mismatch
  const [dashboardData, setDashboardData] = useState<{ type: string; question: string; imageData?: string } | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("dashboard-data");
      if (raw) setDashboardData(JSON.parse(raw));
    } catch {}
  }, []);

  const type = dashboardData?.type || urlType;
  const question = dashboardData?.question || "";
  const questionImage = dashboardData?.imageData || null;

  const { messages, sendMessage, status, stop } = useChat();

  const [input, setInput] = useState("");
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [toolboxConfig, setToolboxConfig] = useState<ToolboxConfigFromDB | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = input.trim() && !isLoading;

  const tools = toolboxConfig?.tools ?? [];
  const typeLabel = toolboxConfig?.label ?? type;

  // Fetch toolbox config from DB
  useEffect(() => {
    fetch("/api/toolbox")
      .then((res) => res.json())
      .then((configs: ToolboxConfigFromDB[]) => {
        const matched = configs.find((c) => c.type === type);
        if (matched) setToolboxConfig(matched);
      })
      .catch(() => {});
  }, [type]);

  // Auto-send the initial question to get AI response
  useEffect(() => {
    if (question && !hasSentInitial.current) {
      hasSentInitial.current = true;
      sendMessage({ text: question });
    }
  }, [question, sendMessage]);

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
      {/* Left panel: Toolbox / HTML Preview */}
      <div className="flex flex-1 flex-col min-w-0">
        {selectedTool ? (
          <>
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setSelectedTool(null)}
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <span className="text-sm font-medium">
                  {tools.find((t) => t.key === selectedTool)?.label}{" "}
                  {tools.find((t) => t.key === selectedTool)?.sub}
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

            {/* HTML Preview */}
            <div className="flex-1 overflow-auto p-4 bg-muted/30">
              <div
                className={`h-full mx-auto rounded-xl border border-border bg-white transition-all ${
                  viewMode === "mobile" ? "max-w-[390px]" : "w-full"
                }`}
              >
                <iframe
                  src="/preview.html"
                  className="h-full w-full rounded-xl"
                  sandbox="allow-scripts"
                  title="HTML Preview"
                />
              </div>
            </div>
          </>
        ) : (
          /* Toolbox selection */
          <div className="flex-1 overflow-y-auto p-6">
            {/* Question display */}
            {(question || questionImage) && (
              <div className="rounded-xl border border-border bg-muted/40 p-4 mb-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <Badge variant="outline" className="text-xs font-normal">
                      {typeLabel}
                    </Badge>
                    {questionImage && (
                      <img
                        src={questionImage}
                        alt="題目圖片"
                        className="mt-2 max-h-32 rounded-lg border border-border object-contain"
                      />
                    )}
                    <div className="text-sm font-medium leading-relaxed mt-2 prose prose-sm prose-neutral dark:prose-invert max-w-none">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {question}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <Pencil className="size-4 shrink-0 text-muted-foreground mt-1" />
                </div>
              </div>
            )}

            <h2 className="text-lg font-semibold mb-4">工具箱</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {tools.map(({ key, label, sub, icon, bg, iconBg, border, hover, text }) => {
                const Icon = iconMap[icon] ?? Variable;
                return (
                  <button
                    key={key}
                    onClick={() => setSelectedTool(key)}
                    className={`flex flex-col items-center gap-3 rounded-2xl border-2 p-6 transition-all cursor-pointer shadow-sm hover:shadow-md ${bg} ${border} ${hover}`}
                  >
                    <div className={`flex items-center justify-center size-12 rounded-xl ${iconBg} text-white shadow-sm`}>
                      <Icon className="size-6" strokeWidth={2.5} />
                    </div>
                    <span className={`text-base font-semibold ${text}`}>{label}</span>
                    <span className="text-xs text-muted-foreground">{sub}</span>
                  </button>
                );
              })}
            </div>

            {tools.length === 0 && (
              <div className="text-center text-muted-foreground py-8">
                <p className="text-sm">此題型暫無專用工具箱</p>
                <p className="text-xs mt-1">請在右側與 AI 對話解題</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel: AI Chat (narrower) */}
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
                {message.parts
                  .filter((part): part is { type: "text"; text: string } => part.type === "text")
                  .map((part, i) => (
                    <ReactMarkdown
                      key={i}
                      remarkPlugins={[remarkMath]}
                      rehypePlugins={[rehypeKatex]}
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
                placeholder="繼續提問..."
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
