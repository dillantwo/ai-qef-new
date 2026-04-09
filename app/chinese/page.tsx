"use client";

import { useRouter } from "next/navigation";
import { PenTool, FileText, MessageSquare, ArrowRight } from "lucide-react";
import Header from "@/components/Header";

const topics: {
  id: string;
  label: string;
  labelEn: string;
  description: string;
  icon: typeof PenTool;
  accent: string;
  available: boolean;
}[] = [
  {
    id: "scenery-description",
    label: "景物描寫",
    labelEn: "Scenery Description",
    description: "從觀察、感官描寫到段落鋪陳，建立具畫面感的寫作能力。",
    icon: PenTool,
    accent: "#ff6b00",
    available: true,
  },
  {
    id: "character-description",
    label: "人物描寫",
    labelEn: "Character Description",
    description: "掌握人物外貌、語言、動作與心理描寫的組織方式。",
    icon: MessageSquare,
    accent: "#00d722",
    available: true,
  },
  {
    id: "classical-chinese",
    label: "文言文閱讀",
    labelEn: "Classical Chinese",
    description: "利用 AI 標註虛詞與語義關係，快速理解文言文句式與用法。",
    icon: FileText,
    accent: "#7a3dff",
    available: true,
  },
];

export default function ChinesePage() {
  const router = useRouter();
  const featuredTopic = topics.find((topic) => topic.id === "classical-chinese");
  const writingTopics = topics.filter((topic) => topic.id !== "classical-chinese");

  function navigateToTopic(topicId: string, available: boolean) {
    if (!available) return;
    if (topicId === "classical-chinese") {
      router.push("/chinese/classical-chinese");
      return;
    }
    router.push(`/chinese/dashboard?topic=${topicId}`);
  }

  return (
    <>
      <Header backHref="/" backLabel="選科目" />

      <main className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,_#fffdf8_0%,_#f8f7f4_48%,_#ffffff_100%)]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(255,174,19,0.12),_transparent_42%)]" />
        <div className="absolute right-0 top-24 h-56 w-56 translate-x-1/4 rounded-full bg-[#146ef5]/8 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-10 py-2">
            <section className="grid gap-8 border-b border-[#d8d8d8] px-2 pb-8 pt-4 sm:px-0 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-end">
              <div className="space-y-5">
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#a36a00]">
                  Chinese topic studio
                </p>
                <div className="space-y-3">
                  <h1 className="max-w-4xl font-serif text-[42px] leading-[1.02] font-semibold tracking-[-0.04em] text-[#080808] sm:text-[54px] lg:text-[68px]">
                    中文科主題練習台
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[#4f4f4f] sm:text-lg">
                    這裡不是再次選科目，而是直接進入中文科內部的主題選擇。你可以按寫作類型或閱讀工具，切進不同的學習工作流。
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-[4px] bg-[#ffae13]/12 px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#a36a00]">
                    Chinese only
                  </span>
                  <span className="inline-flex items-center rounded-[4px] border border-[#d8d8d8] bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#080808]">
                    {topics.length} topics ready
                  </span>
                </div>
              </div>

              <aside className="rounded-[8px] border border-[#d8d8d8] bg-white/90 p-5 backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#ababab]">
                  Page guide
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[#4f4f4f]">
                  <p>寫作主題提供段落組織與描寫練習。</p>
                  <p>文言文入口提供 AI 標註與理解輔助。</p>
                  <p>每張卡片都會直接進入中文科對應工具，不會回到科目層級。</p>
                </div>
              </aside>
            </section>

            <section className="grid gap-4 px-2 sm:px-0 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.92fr)]">
              <div className="grid gap-4 sm:grid-cols-2">
                {writingTopics.map(({ id, label, labelEn, description, icon: Icon, accent, available }) => (
                  <button
                    key={id}
                    onClick={() => navigateToTopic(id, available)}
                    disabled={!available}
                    className={[
                      "group flex min-h-[320px] flex-col rounded-[8px] border p-6 text-left transition duration-200",
                      available
                        ? "cursor-pointer border-[#d8d8d8] bg-white hover:-translate-y-1 hover:border-[#080808]"
                        : "cursor-not-allowed border-[#d8d8d8] bg-[#f3f3f1]",
                    ].join(" ")}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div
                        className="flex h-12 w-12 items-center justify-center rounded-[4px] text-white shadow-[6px_6px_0px_#080808]"
                        style={{ backgroundColor: accent }}
                      >
                        <Icon className="size-5" />
                      </div>
                      <span className="text-[11px] font-semibold uppercase tracking-[1.1px] text-[#ababab]">
                        {labelEn}
                      </span>
                    </div>

                    <div className="mt-12 space-y-4">
                      <h2 className="text-[32px] leading-[1.04] font-semibold tracking-[-0.04em] text-[#080808]">
                        {label}
                      </h2>
                      <p className="text-sm leading-7 text-[#5a5a5a]">
                        {description}
                      </p>
                    </div>

                    <div className="mt-auto border-t border-[#d8d8d8] pt-5">
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#080808] transition-transform duration-200 group-hover:translate-x-1">
                        開始這個寫作主題
                        <ArrowRight className="size-4 text-[#146ef5]" />
                      </span>
                    </div>
                  </button>
                ))}
              </div>

              {featuredTopic && (
                <button
                  onClick={() => navigateToTopic(featuredTopic.id, featuredTopic.available)}
                  disabled={!featuredTopic.available}
                  className={[
                    "group relative flex min-h-[420px] flex-col overflow-hidden rounded-[8px] border p-6 text-left transition duration-200",
                    featuredTopic.available
                      ? "cursor-pointer border-[#d8d8d8] bg-[linear-gradient(180deg,_#ffffff_0%,_#f7f3ff_100%)] hover:translate-x-[6px] hover:border-[#080808]"
                      : "cursor-not-allowed border-[#d8d8d8] bg-[#f3f3f1]",
                  ].join(" ")}
                >
                  <div className="absolute right-0 top-0 h-32 w-32 translate-x-1/4 -translate-y-1/4 rounded-full bg-[#7a3dff]/12 blur-3xl" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[4px] text-white shadow-[6px_6px_0px_#080808]"
                      style={{ backgroundColor: featuredTopic.accent }}
                    >
                      <featuredTopic.icon className="size-5" />
                    </div>
                    <span className="inline-flex rounded-[4px] bg-[#7a3dff]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[1px] text-[#7a3dff]">
                      Featured tool
                    </span>
                  </div>

                  <div className="relative mt-14 space-y-5">
                    <p className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#ababab]">
                      {featuredTopic.labelEn}
                    </p>
                    <h2 className="font-serif text-[38px] leading-[1.02] font-semibold tracking-[-0.04em] text-[#080808] sm:text-[46px]">
                      {featuredTopic.label}
                    </h2>
                    <p className="max-w-md text-base leading-7 text-[#4f4f4f]">
                      {featuredTopic.description}
                    </p>
                  </div>

                  <div className="relative mt-8 grid gap-3 border-t border-[#d8d8d8] pt-5 text-sm text-[#5a5a5a]">
                    <p>適合快速拆解虛詞、句式與上下文關係。</p>
                    <p>進入後可直接貼上文段，讓 AI 協助標註與說明。</p>
                  </div>

                  <div className="relative mt-auto flex items-center justify-between pt-6">
                    <span className="text-sm font-medium text-[#080808]">
                      進入文言文閱讀工具
                    </span>
                    <ArrowRight className="size-4 text-[#7a3dff] transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </button>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
