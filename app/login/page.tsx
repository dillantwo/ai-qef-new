"use client";

import { Suspense, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, BookOpen, Loader2, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/AuthProvider";
import { basePath } from "@/lib/utils";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const username = formData.get("username") as string;
    const password = formData.get("password") as string;

    startTransition(async () => {
      try {
        const res = await fetch(`${basePath}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          const data = await res.json();
          setError(data.error ?? "登錄失敗，請重試");
          return;
        }

        await refreshUser();
        const from = searchParams.get("from") ?? "/";
        router.push(from);
        router.refresh();
      } catch {
        setError("網絡錯誤，請重試");
      }
    });
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-white text-[#080808]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(20,110,245,0.1),_transparent_30%),radial-gradient(circle_at_85%_15%,_rgba(237,82,203,0.14),_transparent_24%),linear-gradient(180deg,_#ffffff_0%,_#f7f8fb_100%)]" />
      <div className="absolute left-0 top-0 h-40 w-40 -translate-x-1/3 -translate-y-1/4 rounded-full bg-[#146ef5]/10 blur-3xl" />
      <div className="absolute bottom-0 right-0 h-52 w-52 translate-x-1/4 translate-y-1/4 rounded-full bg-[#7a3dff]/10 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-[8px] border border-[#d8d8d8] bg-white shadow-[0px_84px_24px_rgba(0,0,0,0),0px_54px_22px_rgba(0,0,0,0.01),0px_30px_18px_rgba(0,0,0,0.04),0px_13px_13px_rgba(0,0,0,0.08),0px_3px_7px_rgba(0,0,0,0.09)] lg:grid-cols-[1.15fr_0.85fr]">
          <section className="relative flex flex-col justify-between gap-10 border-b border-[#d8d8d8] bg-[linear-gradient(135deg,_#ffffff_0%,_#f5f8ff_55%,_#ffffff_100%)] px-6 py-8 sm:px-8 sm:py-10 lg:min-h-[720px] lg:border-b-0 lg:border-r lg:px-12 lg:py-12">
            <div className="flex items-center justify-between gap-4">
              <div className="inline-flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-[4px] bg-[#146ef5] text-white shadow-[6px_6px_0px_#080808]">
                  <BookOpen className="size-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[1.4px] text-[#5a5a5a]">
                    AI Learning Platform
                  </p>
                  <p className="text-lg font-semibold tracking-[-0.02em] text-[#080808]">
                    智能學習工作台
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center rounded-[4px] bg-[#146ef5]/10 px-3 py-1 text-[12px] font-semibold uppercase tracking-[1px] text-[#146ef5]">
                Secure Access
              </span>
            </div>

            <div className="flex flex-1 items-center">
              <div className="max-w-xl space-y-6">
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#146ef5]">
                  Design-led learning system
                </p>
                <h1 className="text-[44px] leading-[0.98] font-semibold tracking-[-0.05em] text-[#080808] sm:text-[56px] lg:text-[72px]">
                  進入你的 AI 教學與學習控制台
                </h1>
                <p className="max-w-lg text-base leading-7 text-[#363636] sm:text-lg">
                  以清晰、精準、可執行的工作流管理課程內容，從知識提取到互動練習都集中在同一個介面中。
                </p>
                <div className="flex flex-wrap gap-3 pt-2">
                  <span className="inline-flex items-center rounded-[4px] border border-[#d8d8d8] bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#080808]">
                    數學 / 中文 / 英文
                  </span>
                  <span className="inline-flex items-center rounded-[4px] border border-[#d8d8d8] bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#080808]">
                    備課 / 練習 / 對話
                  </span>
                </div>
              </div>
            </div>
          </section>

          <section className="flex items-center bg-white px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
            <div className="mx-auto w-full max-w-md">
              <div className="rounded-[8px] border border-[#d8d8d8] bg-white p-6 shadow-[0px_84px_24px_rgba(0,0,0,0),0px_54px_22px_rgba(0,0,0,0.01),0px_30px_18px_rgba(0,0,0,0.04),0px_13px_13px_rgba(0,0,0,0.08),0px_3px_7px_rgba(0,0,0,0.09)] sm:p-8">
                <div className="space-y-3">
                  <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#146ef5]">
                    Member login
                  </p>
                  <h2 className="text-[32px] leading-[1.04] font-semibold tracking-[-0.04em] text-[#080808]">
                    登錄並繼續使用
                  </h2>
                  <p className="text-sm leading-6 text-[#5a5a5a]">
                    請輸入帳戶資料以進入你的個人化學習空間。
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div className="space-y-2.5">
                    <label
                      htmlFor="username"
                      className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#363636]"
                    >
                      用戶名
                    </label>
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      autoComplete="username"
                      required
                      placeholder="輸入用戶名"
                      className="h-12 rounded-[4px] border-[#d8d8d8] bg-white px-4 text-[16px] text-[#080808] placeholder:text-[#ababab] focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/15"
                    />
                  </div>

                  <div className="space-y-2.5">
                    <label
                      htmlFor="password"
                      className="block text-[12px] font-semibold uppercase tracking-[1.2px] text-[#363636]"
                    >
                      密碼
                    </label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      placeholder="輸入密碼"
                      className="h-12 rounded-[4px] border-[#d8d8d8] bg-white px-4 text-[16px] text-[#080808] placeholder:text-[#ababab] focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/15"
                    />
                  </div>

                  {error && (
                    <p className="rounded-[4px] border border-[#ee1d36]/20 bg-[#ee1d36]/7 px-4 py-3 text-sm text-[#ee1d36]">
                      {error}
                    </p>
                  )}

                  <Button
                    type="submit"
                    size="lg"
                    disabled={isPending}
                    className="group h-12 w-full rounded-[4px] bg-[#146ef5] px-4 text-base font-medium text-white transition duration-200 hover:translate-x-[6px] hover:bg-[#0055d4] focus-visible:border-[#146ef5] focus-visible:ring-[3px] focus-visible:ring-[#146ef5]/20"
                  >
                    {isPending ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        登錄中…
                      </>
                    ) : (
                      <>
                        進入平台
                        <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="mt-8 flex items-start gap-3 rounded-[4px] border border-[#d8d8d8] bg-[#f7f8fb] px-4 py-3 text-sm leading-6 text-[#5a5a5a]">
                  <ShieldCheck className="mt-0.5 size-4 shrink-0 text-[#146ef5]" />
                  <p>
                    成功登入後，系統會根據你的帳戶權限自動載入可用科目與工具配置。
                  </p>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
