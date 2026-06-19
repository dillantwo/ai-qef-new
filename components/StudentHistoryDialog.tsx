"use client";

import { useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { MessageSquare, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const REMARK_PLUGINS = [remarkGfm, remarkMath];
const REHYPE_PLUGINS = [[rehypeKatex, { strict: false }]] as never;

export interface StudentSummary {
  id: string;
  displayName: string;
  username: string;
  count: number;
  lastUpdatedAt: string | null;
}

interface HistoryMessagePart {
  type: "text" | "file";
  text?: string;
  url?: string;
  mediaType?: string;
  filename?: string;
}

export interface HistoryChatItem {
  id: string;
  title: string;
  topic: string;
  messages: { id: string; role: string; parts: HistoryMessagePart[] }[];
  updatedAt: string;
}

export default function StudentHistoryDialog({
  open,
  onClose,
  students,
  fetchChats,
  topicLabels,
  title = "學生歷史記錄",
}: {
  open: boolean;
  onClose: () => void;
  students: StudentSummary[];
  fetchChats: (studentId: string) => Promise<HistoryChatItem[]>;
  topicLabels: Record<string, string>;
  title?: string;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [chats, setChats] = useState<HistoryChatItem[]>([]);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const topicLabel = (topic: string) => topicLabels[topic] ?? topic;

  // Reset everything whenever the popup is (re)opened.
  useEffect(() => {
    if (!open) {
      setSelectedStudentId(null);
      setChats([]);
      setSelectedChatId(null);
    }
  }, [open]);

  // Load a student's chats when one is selected.
  useEffect(() => {
    if (!open || !selectedStudentId) return;
    let cancelled = false;
    setLoading(true);
    setChats([]);
    setSelectedChatId(null);
    fetchChats(selectedStudentId)
      .then((items) => {
        if (cancelled) return;
        setChats(items);
        setSelectedChatId(items[0]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedStudentId, fetchChats]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const selectedChat = useMemo(
    () => chats.find((c) => c.id === selectedChatId) ?? null,
    [chats, selectedChatId],
  );

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm">
            <Users className="size-4" />
            {title}
          </DialogTitle>
          <DialogDescription className="text-xs">
            選擇學生查看其聊天記錄（僅供查看，無法修改）
          </DialogDescription>
        </DialogHeader>
        <Separator />
        <div className="flex h-[70vh]">
          {/* Pane 1: students */}
          <div className="w-52 shrink-0 overflow-y-auto border-r bg-muted/30 p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              學生
            </p>
            {students.length > 0 ? (
              <div className="space-y-1">
                {students.map((student) => (
                  <button
                    key={student.id}
                    type="button"
                    className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors ${
                      selectedStudentId === student.id
                        ? "bg-blue-50 ring-1 ring-blue-300"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedStudentId(student.id)}
                  >
                    <span className="inline-flex size-7 shrink-0 items-center justify-center rounded-full bg-[#146ef5]/10 text-xs font-semibold text-[#146ef5]">
                      {student.displayName.charAt(0).toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className={`block truncate text-xs font-medium ${
                          selectedStudentId === student.id ? "text-blue-700" : ""
                        }`}
                      >
                        {student.displayName}
                      </span>
                      <span className="block text-[10px] text-muted-foreground">
                        {student.count} 則記錄
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Users className="size-8 mb-2 opacity-30" />
                <p className="text-xs">暫無學生記錄</p>
              </div>
            )}
          </div>

          {/* Pane 2: selected student's chat records */}
          <div className="w-64 shrink-0 overflow-y-auto border-r p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              聊天記錄
            </p>
            {!selectedStudentId ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">請先選擇學生</p>
            ) : loading ? (
              <p className="px-3 py-2 text-xs text-muted-foreground animate-pulse">載入中...</p>
            ) : chats.length > 0 ? (
              <div className="space-y-1">
                {chats.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      selectedChatId === item.id
                        ? "bg-blue-50 ring-1 ring-blue-300"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedChatId(item.id)}
                  >
                    <MessageSquare
                      className={`size-3.5 mt-0.5 shrink-0 ${
                        selectedChatId === item.id ? "text-blue-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-medium leading-snug line-clamp-2 ${
                          selectedChatId === item.id ? "text-blue-700" : ""
                        }`}
                      >
                        {item.title}
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-muted-foreground">
                        <span className="inline-flex items-center rounded-[4px] bg-[#146ef5]/10 px-1.5 py-0.5 font-medium text-[#146ef5]">
                          {topicLabel(item.topic)}
                        </span>
                        {new Date(item.updatedAt).toLocaleString("zh-HK")}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="px-3 py-2 text-xs text-muted-foreground">此學生暫無記錄</p>
            )}
          </div>

          {/* Pane 3: selected chat messages (read-only) */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedChat ? (
              <div className="space-y-4">
                <div className="mb-2 border-b pb-2">
                  <h3 className="text-sm font-semibold">{selectedChat.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedStudent?.displayName} · {topicLabel(selectedChat.topic)}
                  </p>
                </div>
                {selectedChat.messages.map((message) => {
                  const text = message.parts.find((p) => p.type === "text")?.text ?? "";
                  const images = message.parts.filter((p) => p.type === "file" && p.url);
                  if (message.role === "user") {
                    return (
                      <div key={message.id} className="flex flex-col items-end">
                        <div className="min-w-0 max-w-[85%] rounded-2xl bg-[#f4f4f5] px-4 py-2.5 text-sm leading-relaxed text-[#080808]">
                          {images.length > 0 && (
                            <div className="mb-1.5 flex flex-wrap gap-1.5">
                              {images.map((img, idx) => (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  key={idx}
                                  src={img.url}
                                  alt={img.filename ?? "image"}
                                  className="max-h-[200px] max-w-[200px] rounded-[8px] object-contain"
                                />
                              ))}
                            </div>
                          )}
                          <div className="prose prose-sm max-w-none break-words [overflow-wrap:anywhere]">
                            <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
                              {text}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div key={message.id} className="flex flex-col items-start">
                      <div className="min-w-0 max-w-[90%] prose prose-sm max-w-none break-words [overflow-wrap:anywhere] [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-[#e5e5e5] [&_th]:px-2 [&_th]:py-1 [&_th]:bg-[#fafafa] [&_td]:border [&_td]:border-[#e5e5e5] [&_td]:px-2 [&_td]:py-1">
                        <ReactMarkdown remarkPlugins={REMARK_PLUGINS} rehypePlugins={REHYPE_PLUGINS}>
                          {text}
                        </ReactMarkdown>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <MessageSquare className="size-10 mb-2 opacity-30" />
                <p className="text-xs">
                  {!selectedStudentId
                    ? "選擇學生以查看聊天記錄"
                    : loading
                    ? "載入中..."
                    : "選擇記錄以查看內容"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
