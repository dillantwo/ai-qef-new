"use client";

import { Suspense, useRef, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { useChat } from "@ai-sdk/react";
import {
  ArrowUp,
  Square,
  Bot,
  User,
  Pencil,
  ArrowLeft,
  ChevronLeft,
  PanelRight,
  Loader2,
  Sparkles,
  MessageSquare,
  Mic,
  MicOff,
  ImagePlus,
  X,
} from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToolbox, type ToolFromDB } from "@/contexts/ToolboxContext";
import { basePath } from "@/lib/utils";
import { DefaultChatTransport } from "ai";
import { VolumeChatPanel } from "@/components/VolumeChatPanel";

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

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    transport: new DefaultChatTransport({ api: `${basePath}/api/chat` }),
    onError: (error) => {
      console.error("[chat] Error:", error);
    },
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
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [chatFiles, setChatFiles] = useState<File[]>([]);

  // Question-input (placeholder area) state — used when no question is set yet
  const [questionInput, setQuestionInput] = useState("");
  const [questionFiles, setQuestionFiles] = useState<FileList | null>(null);
  const [isClassifying, setIsClassifying] = useState(false);
  const [questionPreviewSrc, setQuestionPreviewSrc] = useState<string | null>(null);
  const [isQuestionListening, setIsQuestionListening] = useState(false);
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const questionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const questionFileInputRef = useRef<HTMLInputElement>(null);
  const questionRecognitionRef = useRef<SpeechRecognition | null>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = (!!input.trim() || chatFiles.length > 0) && !isLoading;

  const selectedTool = toolbox?.selectedTool ?? null;
  const hideChatForTool = selectedTool === "journey-graph";
  const tools = toolboxConfig?.tools ?? [];
  const typeLabel = toolboxConfig?.label ?? type;

  // Fetch toolbox config from DB
  useEffect(() => {
    fetch(`${basePath}/api/toolbox`)
      .then((res) => res.json())
      .then((configs: ToolboxConfigFromDB[]) => {
        setAllToolboxConfigs(configs);
        const matched = configs.find((c) => c.type === type);
        if (matched) {
          setToolboxConfig(matched);
        } else {
          // No specific match (e.g. user hasn't entered a question yet) — fall back
          // to the first math toolbox so the sidebar still shows all tool groups.
          const firstMath = configs.find(
            (c) =>
              c.type !== "english" &&
              c.type !== "chinese" &&
              c.type !== "classical-chinese"
          );
          if (firstMath) setToolboxConfig(firstMath);
        }
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

    // 直接連結到 HTML 的工具（不需要 AI 提取參數）
    const staticHtmlMap: Record<string, string> = {
      "clock-24hrs": "ClockApp1-24hrs.html",
      "clock-time-difference": "ClockApp2-TimeDifference.html",
    };
    // 直接連結到 Next.js route 的工具（同樣不需要 AI 提取參數）
    const staticRouteMap: Record<string, string> = {
      "volume-cubes": "/math/volume",
      "journey-graph": "/math/journey",
    };
    const staticRoute = staticRouteMap[selectedTool];
    if (staticRoute) {
      setPreviewUrl(`${basePath}${staticRoute}`);
      return;
    }
    const staticHtml = staticHtmlMap[selectedTool];
    if (staticHtml) {
      setPreviewUrl(`${basePath}/math/${staticHtml}`);
      return;
    }

    const fractionOpHtmlMap: Record<string, string> = {
      "fraction-addition": "FractionApp-Addition.html",
      "fraction-subtraction": "FractionApp-Subtraction.html",
      "fraction-multiplication": "FractionApp-Multiplication.html",
      "fraction-division": "FractionApp-Division.html",
    };
    const fractionOpHtml = fractionOpHtmlMap[selectedTool];

    if (!question) {
      const fallbackUrl = selectedTool === "fraction-expanding-simplifying"
        ? `${basePath}/math/FractionApp-es.html`
        : fractionOpHtml
          ? `${basePath}/math/${fractionOpHtml}`
          : `${basePath}/math/preview.html`;
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
          body: JSON.stringify({
            question,
            toolKey: selectedTool,
            // 只有在沒有文字題目時才傳圖片，避免 payload 過大
            ...(!question && questionImage ? { imageData: questionImage } : {}),
          }),
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
          // 傳遞目標分數（null/-1 表示空格，不傳該參數讓 FractionApp-es.html 顯示 □）
          if (params.targetNumerator != null && params.targetNumerator !== -1) {
            qs.set("targetNum", String(params.targetNumerator));
          }
          if (params.targetDenominator != null && params.targetDenominator !== -1) {
            qs.set("targetDen", String(params.targetDenominator));
          }
          if (!cancelled) setPreviewUrl(`${basePath}/math/FractionApp-es.html?${qs.toString()}`);
        } else if (fractionOpHtml) {
          const qs = new URLSearchParams();
          // 分子默認 1（AI 回傳 0 通常代表純整數題目，0/1 顯示醜，改用 1）
          qs.set("num1", String(params.num1 && params.num1 !== 0 ? params.num1 : 1));
          // 分母為 0 通常代表題目缺少對應分數，使用默認 1 避免 HTML 除零
          qs.set("den1", String(params.den1 && params.den1 !== 0 ? params.den1 : 1));
          qs.set("num2", String(params.num2 && params.num2 !== 0 ? params.num2 : 1));
          qs.set("den2", String(params.den2 && params.den2 !== 0 ? params.den2 : 1));
          if (params.whole1 != null) qs.set("whole1", String(params.whole1));
          if (params.whole2 != null) qs.set("whole2", String(params.whole2));
          if (!cancelled) setPreviewUrl(`${basePath}/math/${fractionOpHtml}?${qs.toString()}`);
        } else {
          const qs = new URLSearchParams({
            whole1: String(params.whole1 ?? 0),
            num1: String(params.num1 ?? 1),
            den1: String(params.den1 ?? 1),
            whole2: String(params.whole2 ?? 0),
            num2: String(params.num2 ?? 1),
            den2: String(params.den2 ?? 1),
            operation: params.operation ?? selectedTool.split("-")[1] ?? "div",
            context: params.contextText ?? "",
            unit: params.unit ?? "",
          });
          if (!cancelled) setPreviewUrl(`${basePath}/math/preview.html?${qs.toString()}`);
        }
      } catch {
        const fallbackUrl = selectedTool === "fraction-expanding-simplifying"
          ? `${basePath}/math/FractionApp-es.html`
          : fractionOpHtml
            ? `${basePath}/math/${fractionOpHtml}`
            : `${basePath}/math/preview.html`;
        if (!cancelled) setPreviewUrl(fallbackUrl);
      } finally {
        if (!cancelled) setIsExtractingParams(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedTool, question, questionImage]);

  // Auto-send the initial question to get AI response
  useEffect(() => {
    if ((question || questionImage) && !hasSentInitial.current) {
      hasSentInitial.current = true;
      const files = questionImage
        ? [{ type: "file" as const, mediaType: "image/png", url: questionImage }]
        : undefined;
      sendMessage({ text: question || "（見圖片）", ...(files ? { files } : {}) });
    }
  }, [question, questionImage, sendMessage]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  useEffect(() => {
    if (hideChatForTool) stopListening();
  }, [hideChatForTool, stopListening]);

  function toggleVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。');
      return;
    }
    if (isListening) { stopListening(); return; }
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
    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => setIsListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }

  useEffect(() => {
    return () => { recognitionRef.current?.stop(); };
  }, []);

  // Listen for "+ Add New Question" trigger from sidebar.
  // Use refs so the deps array stays stable across renders (useChat's
  // setMessages/stop/status references can change between renders).
  const setMessagesRef = useRef(setMessages);
  const stopRef = useRef(stop);
  const statusRef = useRef(status);
  const toolboxRef = useRef(toolbox);
  useEffect(() => { setMessagesRef.current = setMessages; }, [setMessages]);
  useEffect(() => { stopRef.current = stop; }, [stop]);
  useEffect(() => { statusRef.current = status; }, [status]);
  useEffect(() => { toolboxRef.current = toolbox; }, [toolbox]);

  useEffect(() => {
    function handleNewQuestion() {
      try { sessionStorage.removeItem("dashboard-data"); } catch {}
      setDashboardData(null);
      hasSentInitial.current = false;
      setQuestionInput("");
      setQuestionFiles(null);
      if (questionFileInputRef.current) questionFileInputRef.current.value = "";
      setIsEditingQuestion(true);
      toolboxRef.current?.setSelectedTool(null);
      // Reset the AI chat — start a fresh session
      const s = statusRef.current;
      if (s === "streaming" || s === "submitted") stopRef.current?.();
      setMessagesRef.current?.([]);
      setInput("");
      setChatFiles([]);
    }
    window.addEventListener("dashboard:new-question", handleNewQuestion);
    return () => window.removeEventListener("dashboard:new-question", handleNewQuestion);
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
    const fileParts = await Promise.all(
      chatFiles.map(async (file) => ({
        type: "file" as const,
        mediaType: file.type,
        filename: file.name,
        url: await fileToDataURL(file),
      }))
    );
    sendMessage({ text: input.trim() || "（見圖片）", ...(fileParts.length > 0 ? { files: fileParts } : {}) });
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

  // ===== Question-input handlers (placeholder area) =====
  const canSubmitQuestion = !!(questionInput.trim() || questionFiles) && !isClassifying;

  const stopQuestionListening = useCallback(() => {
    questionRecognitionRef.current?.stop();
    setIsQuestionListening(false);
  }, []);

  function toggleQuestionVoice() {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('您的瀏覽器不支援語音輸入，請使用 Chrome 或 Edge 瀏覽器。');
      return;
    }
    if (isQuestionListening) { stopQuestionListening(); return; }
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
      setQuestionInput(transcript);
    };
    recognition.onerror = () => setIsQuestionListening(false);
    recognition.onend = () => setIsQuestionListening(false);
    questionRecognitionRef.current = recognition;
    recognition.start();
    setIsQuestionListening(true);
  }

  useEffect(() => {
    return () => { questionRecognitionRef.current?.stop(); };
  }, []);

  function questionFileToBase64(file: File): Promise<string> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  function handleQuestionFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files && e.target.files.length > 0) {
      setQuestionFiles(e.target.files);
    }
  }

  function removeQuestionFile(index: number) {
    if (!questionFiles) return;
    const dt = new DataTransfer();
    Array.from(questionFiles).forEach((f, i) => {
      if (i !== index) dt.items.add(f);
    });
    if (dt.files.length === 0) {
      setQuestionFiles(null);
      if (questionFileInputRef.current) questionFileInputRef.current.value = "";
    } else {
      setQuestionFiles(dt.files);
    }
  }

  function handleQuestionPaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
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
    if (questionFiles) Array.from(questionFiles).forEach((f) => dt.items.add(f));
    imageFiles.forEach((f) => dt.items.add(f));
    setQuestionFiles(dt.files);
  }

  async function submitQuestion() {
    if (!canSubmitQuestion) return;
    stopQuestionListening();
    setIsClassifying(true);

    try {
      let imageData: string | undefined;
      if (questionFiles && questionFiles.length > 0) {
        imageData = await questionFileToBase64(questionFiles[0]);
      }

      const res = await fetch(`${basePath}/api/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionInput.trim(),
          imageData,
        }),
      });

      let nextType = "fraction";
      let nextQuestion = questionInput.trim() || "（見圖片）";
      if (res.ok) {
        const json = await res.json();
        nextType = json.type ?? nextType;
        nextQuestion = json.question || nextQuestion;
      }

      sessionStorage.setItem(
        "dashboard-data",
        JSON.stringify({ type: nextType, question: nextQuestion, imageData })
      );

      // Allow the chat auto-send effect to fire with the new question
      hasSentInitial.current = false;
      setDashboardData({ type: nextType, question: nextQuestion, imageData });
      setQuestionInput("");
      setQuestionFiles(null);
      if (questionFileInputRef.current) questionFileInputRef.current.value = "";
      setIsEditingQuestion(false);
    } catch {
      const fallbackQuestion = questionInput.trim() || "（見圖片）";
      sessionStorage.setItem(
        "dashboard-data",
        JSON.stringify({ type: "fraction", question: fallbackQuestion })
      );
      hasSentInitial.current = false;
      setDashboardData({ type: "fraction", question: fallbackQuestion });
      setQuestionInput("");
      setQuestionFiles(null);
      setIsEditingQuestion(false);
    } finally {
      setIsClassifying(false);
    }
  }

  function handleQuestionSubmit(e: React.FormEvent) {
    e.preventDefault();
    submitQuestion();
  }

  function handleQuestionKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submitQuestion();
    }
  }

  return (
    <div className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,_#ffffff_0%,_#f7fbff_45%,_#ffffff_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(20,110,245,0.14),_transparent_48%)]" />

      {/* Left panel: HTML Preview or placeholder */}
      <div className="relative flex min-w-0 flex-1 flex-col border-r border-[#d8d8d8]">
        {/* Page top bar (sibling of chat panel header so they sit at the same top edge) */}
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
          {!chatVisible && !hideChatForTool && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setChatVisible(true)}
              className="rounded-[4px] border border-[#d8d8d8] bg-white/90 shadow-sm backdrop-blur"
              title="顯示 AI 助手"
            >
              <PanelRight className="size-4" />
            </Button>
          )}
        </div>
        {selectedTool ? (
          <>

            {/* Original question bar */}
            {question && (
              <div className="border-b border-[#d8d8d8] bg-[#f7fbff]/80 px-4 py-3">
                <div className="prose prose-base mx-auto max-w-3xl text-center text-base font-medium leading-relaxed text-[#080808] prose-neutral [&_p]:my-0 [&_.katex]:text-lg">
                  <ReactMarkdown
                    remarkPlugins={[remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                  >
                    {question}
                  </ReactMarkdown>
                </div>
              </div>
            )}

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
                        rehypePlugins={[[rehypeKatex, { strict: false }]]}
                      >
                        {question}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingQuestion(true);
                      setQuestionInput(question);
                      setTimeout(() => questionTextareaRef.current?.focus(), 0);
                    }}
                    title="修改題目"
                    className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-[4px] border border-transparent text-[#ababab] transition-colors hover:border-[#d8d8d8] hover:bg-[#f7f7f7] hover:text-[#080808]"
                  >
                    <Pencil className="size-4" />
                  </button>
                </div>
                <div className="mt-4 flex items-center gap-2 rounded-[6px] border border-[#146ef5]/20 bg-[#146ef5]/5 px-3 py-2 text-sm text-[#146ef5]">
                  <ArrowLeft className="size-4 shrink-0" />
                  <span>請從左側工具箱選擇合適的工具開始練習</span>
                </div>
              </div>
            )}

            <div className={`flex flex-col items-center justify-center rounded-[8px] border border-dashed border-[#d8d8d8] bg-white/70 py-10 px-4 text-center ${(question || questionImage) && !isEditingQuestion ? "hidden" : ""}`}>
              {!(question || questionImage) && (
                <>
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[8px] bg-[#146ef5]/10 text-[#146ef5]">
                    <Sparkles className="size-7" />
                  </div>
                  <p className="text-lg font-semibold text-[#080808]">
                    輸入題目讓 AI 為您解答，或直接從左側工具箱選擇工具開始練習
                  </p>
                  <p className="mt-1.5 mb-7 text-sm text-[#5a5a5a]">
                    部分工具可直接使用，無需輸入題目
                  </p>
                </>
              )}
              {(question || questionImage) && isEditingQuestion && (
                <div className="mb-4 flex items-center justify-between w-full max-w-3xl">
                  <p className="text-sm text-[#5a5a5a]">輸入新題目可重新分類</p>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditingQuestion(false);
                      setQuestionInput("");
                      setQuestionFiles(null);
                    }}
                    className="text-xs text-[#5a5a5a] underline-offset-2 hover:text-[#080808] hover:underline"
                  >
                    取消
                  </button>
                </div>
              )}

              {/* Question input form */}
              <form onSubmit={handleQuestionSubmit} className="w-full max-w-3xl">
                <div className="relative w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[0px_30px_18px_rgba(0,0,0,0.04),0px_13px_13px_rgba(0,0,0,0.08),0px_3px_7px_rgba(0,0,0,0.09)] transition-all focus-within:border-[#146ef5] focus-within:shadow-[0px_30px_18px_rgba(20,110,245,0.09),0px_13px_13px_rgba(20,110,245,0.14),0px_3px_7px_rgba(20,110,245,0.2)]">
                  {questionFiles && questionFiles.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-4 pt-3">
                      {Array.from(questionFiles).map((file, i) => (
                        <div key={i} className="relative group">
                          <img
                            src={URL.createObjectURL(file)}
                            alt={file.name}
                            className="size-16 cursor-zoom-in rounded-[4px] border border-[#d8d8d8] object-cover"
                            onClick={() => setQuestionPreviewSrc(URL.createObjectURL(file))}
                          />
                          <button
                            type="button"
                            onClick={() => removeQuestionFile(i)}
                            className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-[#080808] text-white opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            <X className="size-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <Textarea
                    ref={questionTextareaRef}
                    placeholder="輸入數學題目，例如：3/4 + 1/2 = ?（可直接粘貼圖片）"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={handleQuestionKeyDown}
                    onPaste={handleQuestionPaste}
                    disabled={isClassifying}
                    className="min-h-[140px] resize-none border-0 bg-transparent px-6 pt-5 pb-16 text-xl font-medium leading-[1.6] tracking-[-0.01em] text-left text-[#080808] shadow-none placeholder:text-[#ababab] focus-visible:ring-0"
                  />

                  <input
                    ref={questionFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleQuestionFileChange}
                    className="hidden"
                  />

                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => questionFileInputRef.current?.click()}
                        disabled={isClassifying}
                        className="rounded-[4px] border border-[#d8d8d8] bg-white text-[#080808] transition-all hover:translate-x-[2px] hover:border-[#898989] hover:bg-white hover:text-[#080808]"
                      >
                        <ImagePlus className="size-4 text-[#5a5a5a]" />
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={toggleQuestionVoice}
                        disabled={isClassifying}
                        className={`rounded-[4px] border bg-white transition-all hover:translate-x-[2px] hover:bg-white ${
                          isQuestionListening
                            ? 'border-red-400 text-red-500 hover:border-red-500 hover:text-red-600'
                            : 'border-[#d8d8d8] text-[#080808] hover:border-[#898989] hover:text-[#080808]'
                        }`}
                      >
                        {isQuestionListening ? (
                          <MicOff className="size-4" />
                        ) : (
                          <Mic className="size-4 text-[#5a5a5a]" />
                        )}
                      </Button>
                      {isQuestionListening && (
                        <span className="text-[12px] font-medium text-red-500 animate-pulse">
                          聆聽中…
                        </span>
                      )}
                    </div>

                    <Button
                      type="submit"
                      size="icon"
                      className="rounded-[4px] border border-transparent bg-[#146ef5] text-white shadow-[0_8px_20px_rgba(20,110,245,0.34)] transition-all hover:translate-x-[6px] hover:bg-[#0055d4] hover:shadow-[0_10px_24px_rgba(20,110,245,0.44)]"
                      disabled={!canSubmitQuestion}
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
            </div>

            {/* Question preview lightbox */}
            {questionPreviewSrc && (
              <div
                className="fixed inset-0 z-50 flex cursor-zoom-out items-center justify-center bg-black/70"
                onClick={() => setQuestionPreviewSrc(null)}
              >
                <button
                  className="absolute top-4 right-4 flex size-8 items-center justify-center rounded-full bg-white text-[#080808] transition-colors hover:bg-white/85"
                  onClick={() => setQuestionPreviewSrc(null)}
                >
                  <X className="size-5" />
                </button>
                <img
                  src={questionPreviewSrc}
                  alt="Preview"
                  className="max-h-[90vh] max-w-[90vw] rounded-[8px] object-contain"
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right panel: AI Chat (narrower) */}
      {chatVisible && !hideChatForTool && (selectedTool === "volume-cubes" ? (
        <VolumeChatPanel onHide={() => setChatVisible(false)} />
      ) : (
        <div className="relative flex w-[360px] shrink-0 flex-col min-h-0 bg-white/95">
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
            <Button
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
                placeholder="繼續提問...（可直接粘貼圖片）"
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
                    title="上傳圖片"
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
                    title={isListening ? '停止語音輸入' : '語音輸入'}
                  >
                    {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-[#5a5a5a]" />}
                  </Button>
                  {isListening && (
                    <span className="text-[11px] font-medium text-red-500 animate-pulse">聆聽中…</span>
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
      ))}
    </div>
  );
}
