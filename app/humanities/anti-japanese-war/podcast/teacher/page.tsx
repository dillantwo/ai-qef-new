"use client";

import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Headphones, Loader2, Mic, Users } from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";
import { basePath } from "@/lib/utils";

const TOPIC = "anti-japanese-war";
const API = `${basePath}/api/humanities-podcast/teacher`;

interface StudentSummary {
  id: string;
  displayName: string;
  username: string;
  count: number;
  lastUpdatedAt: string | null;
}

interface RecordingMeta {
  id: string;
  title: string;
  script: string;
  mimeType: string;
  durationSec: number;
  sizeBytes: number;
  createdAt: string;
  updatedAt: string;
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatBytes(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function TeacherPodcastReviewPage() {
  const { user, loading: authLoading } = useAuth();
  const isTeacher = user?.role === "teacher";

  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);

  const [selected, setSelected] = useState<StudentSummary | null>(null);
  const [recordings, setRecordings] = useState<RecordingMeta[]>([]);
  const [recLoading, setRecLoading] = useState(false);

  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const [loadingAudioId, setLoadingAudioId] = useState<string>("");

  const loadStudents = useCallback(async () => {
    setStudentsLoading(true);
    try {
      const res = await fetch(`${API}?topic=${encodeURIComponent(TOPIC)}`, {
        credentials: "include",
      });
      if (res.ok) {
        const json = (await res.json()) as { students?: StudentSummary[] };
        setStudents(Array.isArray(json.students) ? json.students : []);
      }
    } catch {
      /* ignore */
    } finally {
      setStudentsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isTeacher) loadStudents();
    else if (!authLoading) setStudentsLoading(false);
  }, [isTeacher, authLoading, loadStudents]);

  const openStudent = useCallback(async (student: StudentSummary) => {
    setSelected(student);
    setRecordings([]);
    setAudioCache({});
    setRecLoading(true);
    try {
      const res = await fetch(
        `${API}?topic=${encodeURIComponent(TOPIC)}&studentId=${encodeURIComponent(student.id)}`,
        { credentials: "include" },
      );
      if (res.ok) {
        const json = (await res.json()) as { items?: RecordingMeta[] };
        setRecordings(Array.isArray(json.items) ? json.items : []);
      }
    } catch {
      /* ignore */
    } finally {
      setRecLoading(false);
    }
  }, []);

  const loadAudio = useCallback(
    async (recordingId: string) => {
      if (!selected || audioCache[recordingId]) return;
      setLoadingAudioId(recordingId);
      try {
        const res = await fetch(
          `${API}?topic=${encodeURIComponent(TOPIC)}&studentId=${encodeURIComponent(
            selected.id,
          )}&recordingId=${encodeURIComponent(recordingId)}`,
          { credentials: "include" },
        );
        if (res.ok) {
          const json = (await res.json()) as { item?: { audioData?: string } };
          if (json.item?.audioData) {
            setAudioCache((prev) => ({ ...prev, [recordingId]: json.item!.audioData! }));
          }
        }
      } catch {
        /* ignore */
      } finally {
        setLoadingAudioId("");
      }
    },
    [selected, audioCache],
  );

  return (
    <>
      <Header backHref="/humanities/anti-japanese-war/podcast" backLabel="返回語音博客" />

      <main className="flex-1 min-h-0 overflow-y-auto bg-[#f8f7f4] text-[#080808]">
        <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 lg:py-8">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-[#146ef5] text-white shadow-[4px_4px_0px_#080808]">
              <Headphones className="size-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[1.1px] text-[#ababab]">
                Teacher · Student Podcasts
              </p>
              <h1 className="text-[26px] font-semibold leading-tight tracking-[-0.03em] sm:text-[32px]">
                學生的語音博客
              </h1>
            </div>
          </div>

          {authLoading ? (
            <div className="flex items-center gap-2 rounded-[10px] border border-[#d8d8d8] bg-white p-5 text-sm text-[#5a5a5a]">
              <Loader2 className="size-4 animate-spin" /> 載入中…
            </div>
          ) : !isTeacher ? (
            <div className="rounded-[10px] border border-[#d8d8d8] bg-white p-6 text-center text-sm text-[#5a5a5a]">
              此頁面僅供教師查看學生的播客。
            </div>
          ) : selected ? (
            <section>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#146ef5] hover:underline"
              >
                <Users className="size-4" /> 返回學生名單
              </button>

              <div className="mb-4">
                <h2 className="text-xl font-semibold tracking-tight">
                  {selected.displayName}
                </h2>
                <p className="text-sm text-[#ababab]">@{selected.username}</p>
              </div>

              {recLoading ? (
                <div className="flex items-center gap-2 rounded-[10px] border border-[#d8d8d8] bg-white p-5 text-sm text-[#5a5a5a]">
                  <Loader2 className="size-4 animate-spin" /> 載入錄音中…
                </div>
              ) : recordings.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#d8d8d8] bg-white p-6 text-center text-sm text-[#5a5a5a]">
                  這位學生還沒有播客。
                </div>
              ) : (
                <ul className="space-y-3">
                  {recordings.map((rec) => (
                    <li key={rec.id} className="rounded-[10px] border border-[#d8d8d8] bg-white p-4">
                      <p className="text-base font-semibold tracking-tight">🎙️ {rec.title}</p>
                      <p className="mt-0.5 text-xs text-[#ababab]">
                        時長 {formatTime(rec.durationSec)} · {formatBytes(rec.sizeBytes)} ·{" "}
                        {new Date(rec.updatedAt).toLocaleString("zh-HK")}
                      </p>

                      {rec.script && (
                        <p className="mt-2 whitespace-pre-wrap rounded-[6px] bg-[#faf9f6] px-3 py-2 text-sm leading-6 text-[#5a5a5a]">
                          {rec.script}
                        </p>
                      )}

                      <div className="mt-3">
                        {audioCache[rec.id] ? (
                          // eslint-disable-next-line jsx-a11y/media-has-caption
                          <audio controls src={audioCache[rec.id]} className="w-full" />
                        ) : (
                          <button
                            type="button"
                            onClick={() => loadAudio(rec.id)}
                            disabled={loadingAudioId === rec.id}
                            className="inline-flex items-center gap-2 rounded-full border border-[#d8d8d8] px-4 py-2 text-sm font-medium text-[#080808] transition hover:border-[#080808] disabled:opacity-50"
                          >
                            {loadingAudioId === rec.id ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Mic className="size-4 text-[#146ef5]" />
                            )}
                            載入並播放
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ) : (
            <section>
              <h2 className="mb-3 text-lg font-semibold tracking-tight">
                學生名單
                {students.length > 0 && (
                  <span className="ml-2 text-sm font-normal text-[#ababab]">
                    （{students.length}）
                  </span>
                )}
              </h2>

              {studentsLoading ? (
                <div className="flex items-center gap-2 rounded-[10px] border border-[#d8d8d8] bg-white p-5 text-sm text-[#5a5a5a]">
                  <Loader2 className="size-4 animate-spin" /> 載入中…
                </div>
              ) : students.length === 0 ? (
                <div className="rounded-[10px] border border-dashed border-[#d8d8d8] bg-white p-6 text-center text-sm text-[#5a5a5a]">
                  還沒有學生錄製播客。
                </div>
              ) : (
                <ul className="space-y-2">
                  {students.map((s) => (
                    <li key={s.id}>
                      <button
                        type="button"
                        onClick={() => openStudent(s)}
                        className="group flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#d8d8d8] bg-white p-4 text-left transition hover:-translate-y-0.5 hover:border-[#080808]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-base font-semibold tracking-tight">
                            {s.displayName}
                          </p>
                          <p className="text-xs text-[#ababab]">
                            @{s.username} · {s.count} 集
                            {s.lastUpdatedAt
                              ? ` · 最近更新 ${new Date(s.lastUpdatedAt).toLocaleDateString("zh-HK")}`
                              : ""}
                          </p>
                        </div>
                        <ChevronRight className="size-5 shrink-0 text-[#ababab] transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      </main>
    </>
  );
}
