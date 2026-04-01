"use client";

import { useRouter } from "next/navigation";
import { PenTool, FileText, MessageSquare } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";

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
    cardBg: string;
    iconBg: string;
    iconRing: string;
    title: string;
    hoverShadow: string;
  }
> = {
  orange: {
    cardBg: "bg-gradient-to-br from-orange-50 to-amber-50",
    iconBg: "bg-gradient-to-br from-orange-400 to-amber-500",
    iconRing: "ring-orange-200",
    title: "text-orange-700",
    hoverShadow: "hover:shadow-orange-200/60",
  },
  green: {
    cardBg: "bg-gradient-to-br from-emerald-50 to-green-50",
    iconBg: "bg-gradient-to-br from-emerald-400 to-green-500",
    iconRing: "ring-emerald-200",
    title: "text-emerald-700",
    hoverShadow: "hover:shadow-emerald-200/60",
  },
  purple: {
    cardBg: "bg-gradient-to-br from-purple-50 to-violet-50",
    iconBg: "bg-gradient-to-br from-purple-400 to-violet-500",
    iconRing: "ring-purple-200",
    title: "text-purple-700",
    hoverShadow: "hover:shadow-purple-200/60",
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
                      "group relative cursor-pointer border-2 border-transparent transition-all duration-200",
                      available
                        ? `${c.cardBg} ${c.hoverShadow} hover:shadow-xl hover:-translate-y-1 hover:border-white/80`
                        : "bg-muted/30 cursor-not-allowed opacity-50",
                    ].join(" ")}
                  >
                    <CardContent className="flex flex-col items-center gap-4 pt-8 pb-6">
                      {/* Large icon */}
                      <div
                        className={[
                          "flex size-16 items-center justify-center rounded-2xl shadow-md ring-4 transition-transform duration-200 group-hover:scale-110",
                          available
                            ? `${c.iconBg} ${c.iconRing} text-white`
                            : "bg-muted ring-muted-foreground/20 text-muted-foreground",
                        ].join(" ")}
                      >
                        <Icon className="size-8" strokeWidth={2} />
                      </div>

                      {/* Text */}
                      <div className="text-center space-y-1">
                        <p
                          className={`text-lg font-bold ${available ? c.title : "text-muted-foreground"}`}
                        >
                          {label}
                        </p>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {description}
                        </p>
                      </div>

                      {!available && (
                        <span className="absolute top-3 right-3 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                          即將推出
                        </span>
                      )}
                    </CardContent>
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
