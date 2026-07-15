"use client";

import { useEffect, useMemo, useState } from "react";
import { FileText, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

export interface EssayDraftStudentSummary {
  id: string;
  displayName: string;
  username: string;
  count: number;
  lastUpdatedAt: string | null;
}

export interface EssayDraftRecord {
  id: string;
  title: string;
  topic: string;
  first: string;
  revised: string;
  final: string;
  updatedAt: string;
  createdAt: string;
}

const DRAFT_STAGES: { key: "first" | "revised" | "final"; label: string }[] = [
  { key: "first", label: "初稿" },
  { key: "revised", label: "修改版本" },
  { key: "final", label: "終稿" },
];

export default function StudentEssayDraftDialog({
  open,
  onClose,
  students,
  fetchDrafts,
  topicLabels,
  title = "學生作文稿",
}: {
  open: boolean;
  onClose: () => void;
  students: EssayDraftStudentSummary[];
  fetchDrafts: (studentId: string) => Promise<EssayDraftRecord[]>;
  topicLabels: Record<string, string>;
  title?: string;
}) {
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<EssayDraftRecord[]>([]);
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const topicLabel = (topic: string) => topicLabels[topic] ?? topic;

  // Reset everything whenever the popup is (re)opened.
  useEffect(() => {
    if (!open) {
      setSelectedStudentId(null);
      setDrafts([]);
      setSelectedDraftId(null);
    }
  }, [open]);

  // Load a student's drafts when one is selected.
  useEffect(() => {
    if (!open || !selectedStudentId) return;
    let cancelled = false;
    setLoading(true);
    setDrafts([]);
    setSelectedDraftId(null);
    fetchDrafts(selectedStudentId)
      .then((items) => {
        if (cancelled) return;
        setDrafts(items);
        setSelectedDraftId(items[0]?.id ?? null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, selectedStudentId, fetchDrafts]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) ?? null,
    [students, selectedStudentId],
  );

  const selectedDraft = useMemo(
    () => drafts.find((d) => d.id === selectedDraftId) ?? null,
    [drafts, selectedDraftId],
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
            選擇學生查看其作文稿（初稿 / 修改版本 / 終稿，僅供查看，無法修改）
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
                        {student.count} 篇作文稿
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

          {/* Pane 2: selected student's draft list */}
          <div className="w-64 shrink-0 overflow-y-auto border-r p-2">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              作文稿
            </p>
            {!selectedStudentId ? (
              <p className="px-3 py-2 text-xs text-muted-foreground">請先選擇學生</p>
            ) : loading ? (
              <p className="px-3 py-2 text-xs text-muted-foreground animate-pulse">載入中...</p>
            ) : drafts.length > 0 ? (
              <div className="space-y-1">
                {drafts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`flex w-full items-start gap-2 rounded-lg px-2 py-1.5 text-left transition-colors ${
                      selectedDraftId === item.id
                        ? "bg-blue-50 ring-1 ring-blue-300"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => setSelectedDraftId(item.id)}
                  >
                    <FileText
                      className={`size-3.5 mt-0.5 shrink-0 ${
                        selectedDraftId === item.id ? "text-blue-600" : "text-muted-foreground"
                      }`}
                    />
                    <div className="min-w-0 flex-1">
                      <div
                        className={`text-xs font-medium leading-snug line-clamp-2 ${
                          selectedDraftId === item.id ? "text-blue-700" : ""
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
              <p className="px-3 py-2 text-xs text-muted-foreground">此學生暫無作文稿</p>
            )}
          </div>

          {/* Pane 3: selected draft, three stages (read-only) */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedDraft ? (
              <div className="space-y-4">
                <div className="mb-2 border-b pb-2">
                  <h3 className="text-sm font-semibold">{selectedDraft.title}</h3>
                  <p className="text-[10px] text-muted-foreground">
                    {selectedStudent?.displayName} · {topicLabel(selectedDraft.topic)}
                  </p>
                </div>
                {DRAFT_STAGES.map((stage) => {
                  const value = selectedDraft[stage.key]?.trim();
                  return (
                    <div key={stage.key} className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#146ef5]">{stage.label}</p>
                      {value ? (
                        <div className="whitespace-pre-wrap rounded-lg border border-[#ededed] bg-[#fafafa] px-3 py-2.5 text-sm leading-relaxed text-[#080808] [overflow-wrap:anywhere]">
                          {value}
                        </div>
                      ) : (
                        <p className="rounded-lg border border-dashed border-[#ededed] px-3 py-2.5 text-xs text-muted-foreground">
                          （尚未填寫）
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                <FileText className="size-10 mb-2 opacity-30" />
                <p className="text-xs">
                  {!selectedStudentId
                    ? "選擇學生以查看作文稿"
                    : loading
                    ? "載入中..."
                    : "選擇作文稿以查看內容"}
                </p>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
