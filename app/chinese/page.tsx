"use client";

import { useRouter } from "next/navigation";
import { PenTool, FileText, MessageSquare, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const topics: {
  id: string;
  label: string;
  description: string;
  icon: typeof PenTool;
  color: string;
  available: boolean;
}[] = [
  {
    id: "scenery-description",
    label: "景物描寫",
    description: "學習景物描寫的技巧與手法",
    icon: PenTool,
    color: "orange",
    available: true,
  },
  {
    id: "character-description",
    label: "人物描寫",
    description: "學習人物描寫的技巧與手法",
    icon: MessageSquare,
    color: "green",
    available: true,
  },
  {
    id: "classical-chinese",
    label: "文言文閱讀",
    description: "AI 標註虛詞並解釋用法",
    icon: FileText,
    color: "purple",
    available: true,
  },
];

const colorMap: Record<
  string,
  {
    ring: string;
    gradient: string;
    icon: string;
    arrow: string;
  }
> = {
  orange: {
    ring: "ring-orange-200 dark:ring-orange-800",
    gradient: "from-orange-100 to-amber-50 dark:from-orange-950/60 dark:to-amber-900/30",
    icon: "text-orange-600 dark:text-orange-400",
    arrow: "text-orange-600 dark:text-orange-400",
  },
  green: {
    ring: "ring-emerald-200 dark:ring-emerald-800",
    gradient: "from-emerald-100 to-green-50 dark:from-emerald-950/60 dark:to-green-900/30",
    icon: "text-emerald-600 dark:text-emerald-400",
    arrow: "text-emerald-600 dark:text-emerald-400",
  },
  purple: {
    ring: "ring-purple-200 dark:ring-purple-800",
    gradient: "from-purple-100 to-violet-50 dark:from-purple-950/60 dark:to-violet-900/30",
    icon: "text-purple-600 dark:text-purple-400",
    arrow: "text-purple-600 dark:text-purple-400",
  },
};

export default function ChinesePage() {
  const router = useRouter();

  return (
    <>
      <Header backHref="/" backLabel="選科目" />

      <main className="flex flex-1 flex-col px-6 py-10">
        <div className="w-full max-w-3xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">
              中國語文科
            </h1>
            <p className="text-base text-muted-foreground">
              請選擇學習主題，開始使用互動工具學習 📚
            </p>
          </div>

          {/* Topic cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {topics.map(
              ({ id, label, description, icon: Icon, color, available }) => {
                const c = colorMap[color] ?? colorMap.orange;
                return (
                  <Card
                    key={id}
                    onClick={() => {
                      if (!available) return;
                      if (id === "classical-chinese") {
                        router.push("/chinese/classical-chinese");
                      } else {
                        router.push(`/chinese/dashboard?topic=${id}`);
                      }
                    }}
                    className={[
                      "group relative cursor-pointer transition-all duration-200",
                      available
                        ? `bg-gradient-to-br ${c.gradient} ${c.ring} hover:shadow-lg hover:-translate-y-0.5`
                        : "opacity-50 cursor-not-allowed",
                    ].join(" ")}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div className="flex size-12 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                          <Icon className={`size-6 ${c.icon}`} strokeWidth={1.8} />
                        </div>
                        {!available && (
                          <Badge variant="secondary" className="text-[10px]">
                            即將推出
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-base mt-1">{label}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </CardHeader>
                    {available && (
                      <CardContent className="pt-0">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.arrow} group-hover:gap-2 transition-all`}>
                          開始學習
                          <ArrowRight className="size-3.5" />
                        </span>
                      </CardContent>
                    )}
                  </Card>
                );
              }
            )}
          </div>

          {topics.length === 0 && (
            <div className="text-center text-muted-foreground py-12">
              <p className="text-sm">主題即將推出，敬請期待。</p>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
