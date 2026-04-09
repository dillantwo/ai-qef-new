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
  PanelRight,
  Loader2,
  Sparkles,
  MessageSquare,
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
  const [chatVisible, setChatVisible] = useState(true);
  const [toolboxConfig, setToolboxConfig] = useState<ToolboxConfigFromDB | null>(null);
  const [allToolboxConfigs, setAllToolboxConfigs] = useState<ToolboxConfigFromDB[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtractingParams, setIsExtractingParams] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasSentInitial = useRef(false);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = !!input.trim() && !isLoading;

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
    <div className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,_#ffffff_0%,_#f7fbff_45%,_#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(20,110,245,0.14),_transparent_48%)]" />

      {/* Left panel: HTML Preview or placeholder */}
      <div className="relative flex min-w-0 flex-1 flex-col border-r border-[#d8d8d8]">
        {selectedTool ? (
          <>
            {/* Preview header */}
            <div className="flex items-center justify-between border-b border-[#d8d8d8] bg-white/90 px-4 py-2">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => toolbox?.setSelectedTool(null)}
                  className="rounded-[4px]"
                >
                  <ArrowLeft className="size-4" />
                </Button>
                <div className="space-y-0.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#ababab]">
                    Active tool
                  </p>
                  <span className="text-sm font-semibold text-[#080808]">
                    {tools.find((t) => t.key === selectedTool)?.label}{" "}
                    {tools.find((t) => t.key === selectedTool)?.sub}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setChatVisible((v) => !v)}
                className="rounded-[4px]"
                title={chatVisible ? "隱藏 AI 助手" : "顯示 AI 助手"}
              >
                <PanelRight className="size-4" />
              </Button>
            </div>

            {/* HTML Preview */}
            <div className="flex-1 overflow-auto bg-transparent p-4">
              <div
                className="mx-auto h-full w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px] transition-all"
              >
                {isExtractingParams || !previewUrl ? (
                  <div className="flex h-full flex-col items-center justify-center gap-3 text-[#5a5a5a]">
                    <Loader2 className="size-8 animate-spin text-[#146ef5]" />
                    <span className="text-sm font-medium">正在根據題目生成練習...</span>
                  </div>
                ) : (
                  <iframe
                    src={previewUrl}
                    className="h-full w-full rounded-[8px]"
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
              <div className="mb-6 rounded-[8px] border border-[#d8d8d8] bg-white p-5 shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-[1px] text-[#ababab]">
                      Problem detected
                    </p>
                    <Badge variant="outline" className="rounded-[4px] border-[#d8d8d8] bg-[#146ef5]/10 text-xs font-semibold uppercase tracking-[0.8px] text-[#146ef5]">
                      {typeLabel}
                    </Badge>
                    {questionImage && (
                      <img
                        src={questionImage}
                        alt="題目圖片"
                        className="mt-3 max-h-32 rounded-[8px] border border-[#d8d8d8] object-contain"
                      />
                    )}
                    <div className="prose prose-lg mt-3 max-w-none text-lg font-medium leading-relaxed prose-neutral [&_.katex]:text-2xl">
                      <ReactMarkdown
                        remarkPlugins={[remarkMath]}
                        rehypePlugins={[rehypeKatex]}
                      >
                        {question}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <Pencil className="mt-1 size-4 shrink-0 text-[#ababab]" />
                </div>
              </div>
            )}

            <div className="flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#d8d8d8] bg-white/70 py-16 text-center">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-[4px] bg-[#146ef5]/10 text-[#146ef5]">
                <Sparkles className="size-5" />
              </div>
              <p className="text-sm font-semibold text-[#080808]">請從左側工具箱選擇工具開始練習</p>
              <p className="mt-1 text-xs text-[#5a5a5a]">或在右側與 AI 對話解題</p>
            </div>
          </div>
        )}
      </div>

      {/* Right panel: AI Chat (narrower) */}
      {chatVisible && <div className="relative flex w-[360px] shrink-0 flex-col min-h-0 bg-white/95">
        <div className="border-b border-[#d8d8d8] px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#146ef5] text-white">
                <MessageSquare className="size-4" />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#ababab]">Math assistant</p>
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
                <span className="animate-pulse">思考中...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat input */}
        <div className="border-t border-[#d8d8d8] px-3 py-3 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="relative w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]">
              <Textarea
                ref={textareaRef}
                placeholder="繼續提問..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="min-h-[58px] resize-none border-0 bg-transparent px-3 pt-3 pb-10 text-sm shadow-none focus-visible:ring-0"
              />
              <div className="absolute bottom-1.5 right-1.5">
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
      </div>}
    </div>
  );
}
