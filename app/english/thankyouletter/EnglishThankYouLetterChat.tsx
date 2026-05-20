"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  MessageSquare,
  Mic,
  MicOff,
  ImagePlus,
  X,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { ChatAvatar } from "@/components/ChatAvatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { basePath } from "@/lib/utils";

type ChatImage = { mediaType: string; dataUrl: string; filename?: string };
type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  text: string;
  images?: ChatImage[];
};

const TOPIC_ID = "thank-you-letter";
const TOPIC_LABEL = "Thank-You Letter";

export default function EnglishThankYouLetterChat() {
  const makeSessionId = useCallback(
    () =>
      `english-${TOPIC_ID}-${
        typeof crypto !== "undefined" && "randomUUID" in crypto
          ? crypto.randomUUID()
          : Math.random().toString(36).slice(2)
      }`,
    []
  );

  const [sessionId, setSessionId] = useState<string>(() => makeSessionId());
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [status, setStatus] = useState<"idle" | "submitted" | "streaming">("idle");
  const [input, setInput] = useState("");
  const [chatFiles, setChatFiles] = useState<File[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const isLoading = status === "submitted" || status === "streaming";
  const canSend = (!!input.trim() || chatFiles.length > 0) && !isLoading;

  useEffect(() => {
    setSessionId(makeSessionId());
  }, [makeSessionId]);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus("idle");
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  function toggleVoice() {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Your browser does not support voice input. Please use Chrome or Edge.");
      return;
    }
    if (isListening) {
      stopListening();
      return;
    }
    const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;
    const recognition = new SpeechRecognitionCtor();
    recognition.lang = "en-US";
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
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  useEffect(() => {
    function handleNewChat() {
      abortRef.current?.abort();
      abortRef.current = null;
      setMessages([]);
      setInput("");
      setChatFiles([]);
      setStatus("idle");
      setSessionId(makeSessionId());
      if (fileInputRef.current) fileInputRef.current.value = "";
    }

    window.addEventListener("dashboard:new-chat", handleNewChat);
    return () => window.removeEventListener("dashboard:new-chat", handleNewChat);
  }, [makeSessionId]);

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

    const userText = input.trim() || "(see image)";
    const userMsg: ChatMsg = {
      id: `u-${Date.now()}`,
      role: "user",
      text: userText,
      ...(images.length > 0 ? { images } : {}),
    };
    const assistantMsg: ChatMsg = {
      id: `a-${Date.now()}`,
      role: "assistant",
      text: "",
    };

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
        ? {
            images: message.images.map((image) => ({
              mediaType: image.mediaType,
              data: image.dataUrl,
            })),
          }
        : {}),
    }));

    try {
      const res = await fetch(`${basePath}/api/english-thank-you-letter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: payloadMessages, sessionId }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        const errText = await res.text().catch(() => "");
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMsg.id
              ? { ...message, text: `(Error) ${errText || res.statusText}` }
              : message
          )
        );
        setStatus("idle");
        abortRef.current = null;
        return;
      }

      setStatus("streaming");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      // Smooth typewriter effect: tokens may arrive in bursts; reveal them
      // at a steady cadence for a more natural reading flow.
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
          setMessages((prev) =>
            prev.map((message) =>
              message.id === assistantMsg.id ? { ...message, text: snapshot } : message
            )
          );
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
        // Wait for the typewriter to catch up before releasing control.
        await new Promise<void>((resolve) => {
          const waitForCatchUp = () => {
            if (displayed.length >= target.length) {
              if (rafId !== null) cancelAnimationFrame(rafId);
              setMessages((prev) =>
                prev.map((message) =>
                  message.id === assistantMsg.id ? { ...message, text: target } : message
                )
              );
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
        setMessages((prev) =>
          prev.map((message) =>
            message.id === assistantMsg.id
              ? {
                  ...message,
                  text:
                    error instanceof Error ? `(Error) ${error.message}` : "(Error) Unknown error",
                }
              : message
          )
        );
      } else {
        setMessages((prev) => prev.filter((message) => message.id !== assistantMsg.id || message.text));
      }
    } finally {
      abortRef.current = null;
      setStatus("idle");
    }
  }

  function handleChatFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (files) {
      setChatFiles((prev) => [...prev, ...Array.from(files)]);
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
    void doSend();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void doSend();
    }
  }

  return (
    <div className="flex flex-1 flex-col min-w-0 overflow-hidden bg-white">
      <div className="border-b border-[#d8d8d8] px-4 py-3 bg-white">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-[4px] bg-[#146ef5] text-white">
            <MessageSquare className="size-4" />
          </div>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[1px] text-[#ababab]">English assistant</p>
            <p className="text-sm font-semibold text-[#080808]">{TOPIC_LABEL}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col min-h-0 w-full">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 min-h-0 bg-[linear-gradient(180deg,_rgba(20,110,245,0.03)_0%,_rgba(255,255,255,1)_35%)]">
          {messages.length === 0 && (
            <div className="flex h-full items-center justify-center text-sm text-[#5a5a5a]">
              Start chatting with AI to practise {TOPIC_LABEL}.
            </div>
          )}
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
                className={`prose prose-sm max-w-none max-w-[85%] rounded-[8px] border px-3 py-2 text-sm leading-relaxed ${
                  message.role === "user"
                    ? "border-[#146ef5] bg-[#146ef5] text-white prose-invert"
                    : "border-[#d8d8d8] bg-white text-[#080808] prose-neutral"
                }`}
              >
                {message.images && message.images.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-1.5 not-prose">
                    {message.images.map((image, index) => (
                      <img
                        key={index}
                        src={image.dataUrl}
                        alt={image.filename ?? "uploaded image"}
                        className="max-w-[200px] max-h-[200px] rounded-[4px] border border-white/30 object-contain"
                      />
                    ))}
                  </div>
                )}
                {message.text ? (
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm, remarkMath]}
                    rehypePlugins={[[rehypeKatex, { strict: false }]]}
                    components={{
                      a: ({ href, children, ...props }) => (
                        <a
                          {...props}
                          href={href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={
                            message.role === "user"
                              ? "underline text-white hover:text-white/80"
                              : "text-[#146ef5] underline hover:text-[#0055d4]"
                          }
                        >
                          {children}
                        </a>
                      ),
                    }}
                  >
                    {message.text}
                  </ReactMarkdown>
                ) : message.role === "assistant" ? (
                  <span className="animate-pulse text-[#5a5a5a]">Thinking...</span>
                ) : null}
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

        <div className="border-t border-[#d8d8d8] px-3 py-3 bg-white">
          <form onSubmit={handleSubmit}>
            <div className="relative w-full rounded-[8px] border border-[#d8d8d8] bg-white shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px]">
              {chatFiles.length > 0 && (
                <div className="flex flex-wrap gap-1.5 px-3 pt-2">
                  {chatFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="size-12 rounded-[4px] border border-[#d8d8d8] object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => removeChatFile(index)}
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
                placeholder="Continue asking... (paste images directly)"
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
                        ? "border-red-400 text-red-500 hover:border-red-500 hover:text-red-600"
                        : "border-[#d8d8d8] text-[#080808] hover:border-[#898989] hover:text-[#080808]"
                    }`}
                    title={isListening ? "Stop voice input" : "Voice input"}
                  >
                    {isListening ? <MicOff className="size-3.5" /> : <Mic className="size-3.5 text-[#5a5a5a]" />}
                  </Button>
                  {isListening && (
                    <span className="text-[11px] font-medium text-red-500 animate-pulse">Listening...</span>
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