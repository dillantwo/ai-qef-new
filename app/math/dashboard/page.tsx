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
  ArrowLeft,
  Monitor,
  Smartphone,
  Loader2,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToolbox, type ToolFromDB } from "@/contexts/ToolboxContext";
import { basePath } from "@/lib/utils";
import { DefaultChatTransport } from "ai";

interface ToolboxConfigFromDB {
  type: string;
  label: string;
  description: string;
  tools: ToolFromDB[];
  isActive: boolean;
}

export default function MathDashboardPage() {
  return (
    <Suspense>
      <MathDashboardContent />
    </Suspense>
  );
}

function MathDashboardContent() {
  const searchParams = useSearchParams();
  const urlType = searchParams.get("type") || "other";
  const toolbox = useToolbox();

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

  const { messages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: `${basePath}/api/chat` }),
  });

  const [input, setInput] = useState("");
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [toolboxConfig, setToolboxConfig] = useState<ToolboxConfigFromDB | null>(null);
  const [allToolboxConfigs, setAllToolboxConfigs] = useState<ToolboxConfigFromDB[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtractingParams, setIsExtractingParams] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = input.trim() && !isLoading;

  const selectedTool = toolbox?.selectedTool ?? null;
  const tools = toolboxConfig?.tools ?? [];
  const typeLabel = toolboxConfig?.label ?? type;

  // Fetch toolbox config from DB
  useEffect(() => {
    fetch(`${basePath}/api/toolbox`)
      .then((res) => res.json())
      .then((configs: ToolboxConfigFromDB[]) => {
        setAllToolboxConfigs(configs);
        const matched = configs.find((c) => c.type === type);
        if (matched) setToolboxConfig(matched);
      })
      .catch(() => {});
  }, [type]);

  // Fetch AI-recommended tools
  const [recommendedToolKeys, setRecommendedToolKeys] = useState<string[]>([]);
  useEffect(() => {
    if (!question || !toolboxConfig?.tools.length) return;
    fetch(`${basePath}/api/recommend-tools`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question,
        tools: toolboxConfig.tools.map((t) => ({ key: t.key, label: t.label, sub: t.sub })),
      }),
    })
      .then((res) => res.json())
      .then((data) => setRecommendedToolKeys(data.recommendedKeys ?? []))
      .catch(() => {});
  }, [question, toolboxConfig]);

  // Register tools into sidebar context
  const register = toolbox?.register;
  useEffect(() => {
    if (register && toolboxConfig) {
      const mathConfigs = allToolboxConfigs.filter(
        (c) => c.type !== "english" && c.type !== "chinese" && c.type !== "classical-chinese"
      );
      register({
        tools: toolboxConfig.tools,
        allToolGroups: mathConfigs.map((c) => ({ label: c.label, tools: c.tools })),
        typeLabel: toolboxConfig.label,
        question,
        questionImage,
        recommendedToolKeys,
      });
    }
  }, [register, toolboxConfig, allToolboxConfigs, question, questionImage, recommendedToolKeys]);

  // React to tool selection from sidebar
  useEffect(() => {
    if (!selectedTool) {
      setPreviewUrl(null);
      return;
    }

    if (!question) {
      const fallbackUrl = selectedTool === "fraction-expanding-simplifying" ? `${basePath}/math/es.html` : `${basePath}/math/preview.html`;
      setPreviewUrl(fallbackUrl);
      return;
    }

    let cancelled = false;
    setPreviewUrl(null);
    setIsExtractingParams(true);

    (async () => {
      try {
        const res = await fetch(`${basePath}/api/extract-params`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question, toolKey: selectedTool }),
        });
        if (!res.ok) throw new Error("Extract failed");
        if (cancelled) return;
        const params = await res.json();

        if (selectedTool === "fraction-expanding-simplifying") {
          const qs = new URLSearchParams({
            numerator: String(params.numerator ?? 2),
            denominator: String(params.denominator ?? 8),
            mode: params.mode ?? "expand",
          });
          // 傳遞目標分數（-1 表示空格，不傳該參數讓 es.html 顯示 □）
          if (params.targetNumerator != null && params.targetNumerator !== -1) {
            qs.set("targetNum", String(params.targetNumerator));
          }
          if (params.targetDenominator != null && params.targetDenominator !== -1) {
            qs.set("targetDen", String(params.targetDenominator));
          }
          if (!cancelled) setPreviewUrl(`${basePath}/math/es.html?${qs.toString()}`);
        } else {
          const qs = new URLSearchParams({
            whole1: String(params.whole1 ?? 0),
            num1: String(params.num1 ?? 0),
            den1: String(params.den1 ?? 1),
            whole2: String(params.whole2 ?? 0),
            num2: String(params.num2 ?? 0),
            den2: String(params.den2 ?? 1),
            operation: params.operation ?? selectedTool.split("-")[1] ?? "div",
            context: params.contextText ?? "",
            unit: params.unit ?? "",
          });
          if (!cancelled) setPreviewUrl(`${basePath}/math/preview.html?${qs.toString()}`);
        }
      } catch {
        const fallbackUrl = selectedTool === "fraction-expanding-simplifying" ? `${basePath}/math/es.html` : `${basePath}/math/preview.html`;
        if (!cancelled) setPreviewUrl(fallbackUrl);
      } finally {
        if (!cancelled) setIsExtractingParams(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTool, question]);

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
      {/* Left panel: HTML Preview or placeholder */}
      <div className="flex flex-1 flex-col min-w-0">
        {selectedTool ? (
          <>
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toolbox?.setSelectedTool(null)}
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
                {isExtractingParams || !previewUrl ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-muted-foreground">
                    <Loader2 className="size-8 animate-spin" />
                    <span className="text-sm">正在根據題目生成練習...</span>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="h-full w-full rounded-xl"
                    sandbox="allow-scripts"
                    title="HTML Preview"
                  />
                )}
              </div>
            </div>
          </>
        ) : (
          /* Placeholder when no tool selected */
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
                    <div className="text-lg font-medium leading-relaxed mt-2 prose prose-lg prose-neutral dark:prose-invert max-w-none [&_.katex]:text-2xl">
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

            <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
              <p className="text-sm">請從左側工具箱選擇工具開始練習</p>
              <p className="text-xs mt-1">或在右側與 AI 對話解題</p>
            </div>
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
