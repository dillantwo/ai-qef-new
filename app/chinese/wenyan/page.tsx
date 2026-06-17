"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  ScrollText,
  BookOpen,
  Swords,
  Trophy,
  Star,
  ArrowRight,
  Lock,
} from "lucide-react";
import { WENYAN_TEXTS } from "@/lib/wenyan-texts";
import {
  BADGES,
  getProgress,
  type ProgressSnapshot,
} from "@/lib/wenyan-progress";

export default function WenyanDashboard() {
  const router = useRouter();
  const [progress, setProgress] = useState<ProgressSnapshot | null>(null);

  // localStorage is client-only, so read after mount.
  useEffect(() => {
    setProgress(getProgress());
  }, []);

  const totalTexts = WENYAN_TEXTS.length;
  const completed = progress?.completedTexts.length ?? 0;
  const learnPct = totalTexts ? Math.round((completed / totalTexts) * 100) : 0;
  const bestScore = progress?.bestScore ?? 0;
  const plays = progress?.plays ?? 0;
  const ownedBadges = new Set(progress?.badges ?? []);

  return (
    <div className="relative flex flex-1 flex-col overflow-hidden bg-white text-[#080808]">
      {/* Top bar */}
      <div className="flex h-[57px] shrink-0 items-center justify-between border-b border-[#ededed] bg-white px-4">
        <Link
          href="/chinese"
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="size-4" />
          返回中文科
        </Link>
        <div className="flex items-center gap-2">
          <ScrollText className="size-4 text-[#7a3dff]" />
          <span className="text-sm font-semibold text-[#080808]">學習文言文</span>
        </div>
        <div className="w-[96px]" />
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_12%_8%,rgba(122,61,255,0.10),transparent_38%),radial-gradient(circle_at_88%_10%,rgba(255,174,19,0.12),transparent_36%),linear-gradient(180deg,#fbfaff_0%,#f7f7fb_100%)] px-4 py-8 md:px-6">
        <div className="mx-auto w-full max-w-4xl space-y-8">
          {/* Hero */}
          <div className="text-center space-y-3">
            <h1 className="font-serif text-[36px] font-semibold tracking-[-0.02em] text-[#1a1330]">
              文言文小遊戲
            </h1>
            <p className="mx-auto max-w-xl text-sm leading-7 text-[#6b6385]">
              一邊玩一邊學文言文！「學習模式」帶你慢慢讀懂經典故事，「挑戰模式」考考你常用字的意思，賺取分數和獎章。
            </p>
            <a
              href="https://www.edb.gov.hk/tc/curriculum-development/kla/chi-edu/key-stage2.html"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[#e6e1f3] bg-white/80 px-3 py-1 text-[11px] font-medium text-[#7a6f95] transition hover:border-[#c4b8ec] hover:text-[#5a25d6]"
            >
              篇章選自教育局《建議篇章》第二學習階段（小三至小六）
            </a>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard
              icon={BookOpen}
              label="已完成篇章"
              value={`${completed}/${totalTexts}`}
              accent="#7a3dff"
            />
            <StatCard
              icon={Trophy}
              label="挑戰最高分"
              value={`${bestScore}`}
              accent="#f59e0b"
            />
            <StatCard
              icon={Star}
              label="已得獎章"
              value={`${ownedBadges.size}/${BADGES.length}`}
              accent="#16a34a"
            />
          </div>

          {/* Mode cards */}
          <div className="grid gap-5 sm:grid-cols-2">
            {/* Learning mode */}
            <button
              onClick={() => router.push("/chinese/wenyan/learn")}
              className="group flex flex-col rounded-[20px] border border-[#e6e1f3] bg-white/92 p-6 text-left shadow-[0_12px_32px_rgba(122,61,255,0.10)] transition duration-200 hover:-translate-y-1 hover:border-[#7a3dff]/50"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#7a3dff] text-white shadow-[5px_5px_0px_#1a1330]">
                <BookOpen className="size-6" />
              </div>
              <h2 className="mt-5 font-serif text-[26px] font-semibold tracking-[-0.02em] text-[#1a1330]">
                學習模式
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6385]">
                跟着任務一步步讀通文言文：讀原文、拆解字詞、練習翻譯。完成後解鎖「勤學書生」獎章。
              </p>

              {/* Learn progress bar */}
              <div className="mt-5 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-[#9a8fb5]">
                  <span>學習進度</span>
                  <span className="font-semibold text-[#7a3dff]">{learnPct}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#efeafb]">
                  <div
                    className="h-full rounded-full bg-[#7a3dff] transition-all"
                    style={{ width: `${learnPct}%` }}
                  />
                </div>
              </div>

              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#7a3dff] transition-transform duration-200 group-hover:translate-x-1">
                進入學習模式
                <ArrowRight className="size-4" />
              </span>
            </button>

            {/* Challenge mode */}
            <button
              onClick={() => router.push("/chinese/wenyan/challenge")}
              className="group flex flex-col rounded-[20px] border border-[#f6d9a8] bg-white/92 p-6 text-left shadow-[0_12px_32px_rgba(245,158,11,0.12)] transition duration-200 hover:-translate-y-1 hover:border-[#f59e0b]/60"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-[14px] bg-[#f59e0b] text-white shadow-[5px_5px_0px_#1a1330]">
                <Swords className="size-6" />
              </div>
              <h2 className="mt-5 font-serif text-[26px] font-semibold tracking-[-0.02em] text-[#1a1330]">
                挑戰模式
              </h2>
              <p className="mt-2 text-sm leading-6 text-[#6b6385]">
                從文言文片段抽出常用字，用選擇題猜猜它的意思。答得越準，分數越高，還能贏取獎章！
              </p>

              <div className="mt-5 flex items-center gap-4 text-xs text-[#9a8fb5]">
                <span>
                  最高分　<span className="font-semibold text-[#f59e0b]">{bestScore}</span>
                </span>
                <span>
                  已挑戰　<span className="font-semibold text-[#f59e0b]">{plays}</span> 次
                </span>
              </div>

              <span className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-[#f59e0b] transition-transform duration-200 group-hover:translate-x-1">
                開始挑戰
                <ArrowRight className="size-4" />
              </span>
            </button>
          </div>

          {/* Badge shelf */}
          <div className="rounded-[20px] border border-[#e6e1f3] bg-white/80 p-6">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-[#1a1330]">
              <Trophy className="size-4 text-[#f59e0b]" />
              我的獎章
            </h3>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {BADGES.map((b) => {
                const owned = ownedBadges.has(b.id);
                return (
                  <div
                    key={b.id}
                    className={[
                      "flex items-center gap-3 rounded-[14px] border p-3 transition",
                      owned
                        ? "border-[#f6d9a8] bg-[#fffbeb]"
                        : "border-[#ececec] bg-[#f7f7f7]",
                    ].join(" ")}
                  >
                    <div
                      className={[
                        "flex size-10 shrink-0 items-center justify-center rounded-full text-xl",
                        owned ? "bg-white" : "bg-[#ededed] grayscale",
                      ].join(" ")}
                    >
                      {owned ? b.emoji : <Lock className="size-4 text-[#b3b3b3]" />}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={[
                          "truncate text-sm font-semibold",
                          owned ? "text-[#1a1330]" : "text-[#9a9a9a]",
                        ].join(" ")}
                      >
                        {b.label}
                      </p>
                      <p className="truncate text-xs text-[#9a8fb5]">{b.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  accent: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[16px] border border-[#e6e1f3] bg-white/90 p-4">
      <div
        className="flex size-10 shrink-0 items-center justify-center rounded-[10px] text-white"
        style={{ backgroundColor: accent }}
      >
        <Icon className="size-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] uppercase tracking-[1px] text-[#9a8fb5]">{label}</p>
        <p className="text-xl font-semibold text-[#1a1330]">{value}</p>
      </div>
    </div>
  );
}
