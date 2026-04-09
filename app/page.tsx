"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Calculator,
  BookOpen,
  Globe,
  FlaskConical,
  Landmark,
} from "lucide-react";
import Header from "@/components/Header";
import { useAuth } from "@/components/AuthProvider";

const subjects = [
  {
    id: "math",
    label: "數學科",
    labelEn: "Mathematics",
    description: "代數、函數與解題步驟拆解。",
    icon: Calculator,
    href: "/math",
    available: true,
    accent: "#146ef5",
  },
  {
    id: "chinese",
    label: "中國語文科",
    labelEn: "Chinese Language",
    description: "閱讀理解、寫作與古文支援。",
    icon: BookOpen,
    href: "/chinese",
    available: true,
    accent: "#7a3dff",
  },
  {
    id: "english",
    label: "英國語文科",
    labelEn: "English Language",
    description: "語法、寫作與情境練習。",
    icon: Globe,
    href: "/english",
    available: true,
    accent: "#00d722",
  },
  {
    id: "science",
    label: "科學科",
    labelEn: "Science",
    description: "實驗概念與跨單元推理功能即將加入。",
    icon: FlaskConical,
    href: "/science",
    available: false,
    accent: "#ff6b00",
  },
  {
    id: "humanities",
    label: "人文科",
    labelEn: "Humanities",
    description: "議題分析、資料整理與觀點比較。",
    icon: Landmark,
    href: "/humanities",
    available: false,
    accent: "#ed52cb",
  },
];

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const userSubjects = user?.subjects ?? [];

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  return (
    <>
      <Header />

      <main className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,110,245,0.1),_transparent_26%),radial-gradient(circle_at_100%_10%,_rgba(237,82,203,0.1),_transparent_20%),linear-gradient(180deg,_#ffffff_0%,_#f7f8fb_100%)]" />
        <div className="absolute left-0 top-0 h-44 w-44 -translate-x-1/3 -translate-y-1/4 rounded-full bg-[#146ef5]/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-56 w-56 translate-x-1/4 translate-y-1/4 rounded-full bg-[#7a3dff]/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col">
            <section className="px-2 py-4 sm:px-0 sm:py-6 lg:py-8">
              <h1 className="max-w-3xl text-[40px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#080808] sm:text-[52px] lg:text-[64px]">
                選擇你要進入的學習科目
              </h1>
            </section>

            <section className="px-2 py-4 sm:px-0 sm:py-6 lg:py-8">
              {loading ? (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {subjects.map(({ id }) => (
                    <div
                      key={id}
                      className="animate-pulse rounded-[8px] border border-[#d8d8d8] bg-[#f7f8fb] p-6"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="h-12 w-12 rounded-[4px] bg-white" />
                        <div className="h-6 w-20 rounded-[4px] bg-white" />
                      </div>
                      <div className="mt-8 space-y-3">
                        <div className="h-8 w-2/3 rounded-[4px] bg-white" />
                        <div className="h-4 w-1/2 rounded-[4px] bg-white" />
                        <div className="h-4 w-full rounded-[4px] bg-white" />
                        <div className="h-4 w-5/6 rounded-[4px] bg-white" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {subjects.map(
                    ({ id, label, labelEn, description, icon: Icon, href, available, accent }) => {
                      const hasAccess = userSubjects.includes(
                        id as import("@/models/User").Subject,
                      );
                      const enabled = available && hasAccess;
                      const statusLabel = !available
                        ? "即將推出"
                        : hasAccess
                          ? "可進入"
                          : "無權限";
                      const statusClass = !available
                        ? "bg-[#080808]/6 text-[#5a5a5a]"
                        : hasAccess
                          ? "bg-[#146ef5]/10 text-[#146ef5]"
                          : "bg-[#ee1d36]/10 text-[#ee1d36]";

                      return (
                        <button
                          key={id}
                          onClick={() => enabled && router.push(href)}
                          disabled={!enabled}
                          className={[
                            "group relative flex min-h-[280px] flex-col rounded-[8px] border p-6 text-left transition duration-200",
                            enabled
                              ? "cursor-pointer border-[#d8d8d8] bg-white hover:translate-x-[6px] hover:border-[#080808]"
                              : "cursor-not-allowed border-[#d8d8d8] bg-[#f7f8fb]",
                          ].join(" ")}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div
                              className="flex h-12 w-12 items-center justify-center rounded-[4px] text-white shadow-[6px_6px_0px_#080808]"
                              style={{ backgroundColor: accent }}
                            >
                              <Icon className="size-5" />
                            </div>
                            <span
                              className={[
                                "inline-flex rounded-[4px] px-3 py-1 text-[12px] font-semibold uppercase tracking-[1px]",
                                statusClass,
                              ].join(" ")}
                            >
                              {statusLabel}
                            </span>
                          </div>

                          <div className="mt-10 space-y-3">
                            <div>
                              <p className="text-[12px] font-semibold uppercase tracking-[1.4px] text-[#ababab]">
                                {labelEn}
                              </p>
                              <h2 className="mt-2 text-[28px] leading-[1.05] font-semibold tracking-[-0.04em] text-[#080808]">
                                {label}
                              </h2>
                            </div>
                            <p className="max-w-sm text-sm leading-6 text-[#5a5a5a]">
                              {description}
                            </p>
                          </div>

                          <div className="mt-auto flex items-center justify-between border-t border-[#d8d8d8] pt-5 text-sm">
                            <span className="font-medium text-[#363636]">
                              {enabled
                                ? "進入科目工作台"
                                : !available
                                  ? "功能正在準備中"
                                  : "請聯絡管理員開通權限"}
                            </span>
                            <ArrowRight
                              className={[
                                "size-4 transition-transform duration-200",
                                enabled ? "text-[#146ef5] group-hover:translate-x-1" : "text-[#ababab]",
                              ].join(" ")}
                            />
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
