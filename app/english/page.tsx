"use client";

import { useRouter } from "next/navigation";
import { Compass, MapPin, BookOpen, MessageCircle, Mic } from "lucide-react";
import Header from "@/components/Header";

const topics = [
  {
    id: "location-direction",
    label: "Location and Direction",
    description: "Learn prepositional phrases with map navigation",
    icon: Compass,
    color: "blue",
    available: true,
  },
];

const colorMap: Record<string, { bg: string; iconBg: string; border: string; hover: string; text: string }> = {
  blue: {
    bg: "bg-blue-50",
    iconBg: "bg-blue-500",
    border: "border-blue-200",
    hover: "hover:border-blue-400 hover:shadow-blue-100",
    text: "text-blue-700",
  },
};

export default function EnglishPage() {
  const router = useRouter();

  return (
    <>
      <Header backHref="/" backLabel="選科目" />

      <main className="flex flex-1 flex-col px-6 py-8">
        <div className="w-full max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">
              English Language
            </h1>
            <p className="text-sm text-muted-foreground">
              Select a topic to start learning with interactive tools.
            </p>
          </div>

          {/* Topic cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {topics.map(({ id, label, description, icon: Icon, color, available }) => {
              const c = colorMap[color] ?? colorMap.blue;
              return (
                <button
                  key={id}
                  onClick={() => available && router.push(`/english/dashboard?topic=${id}`)}
                  disabled={!available}
                  className={[
                    "group relative flex items-start gap-4 rounded-xl border-2 p-5 text-left transition-all duration-200",
                    available
                      ? `${c.bg} ${c.border} ${c.hover} hover:shadow-lg hover:-translate-y-0.5 cursor-pointer`
                      : "bg-muted/30 border-border/50 cursor-not-allowed opacity-50",
                  ].join(" ")}
                >
                  <div
                    className={[
                      "flex size-11 shrink-0 items-center justify-center rounded-xl shadow-sm transition-transform group-hover:scale-110",
                      available ? `${c.iconBg} text-white` : "bg-muted text-muted-foreground",
                    ].join(" ")}
                  >
                    <Icon className="size-5" strokeWidth={2.5} />
                  </div>
                  <div className="space-y-1 min-w-0">
                    <p className={`text-sm font-semibold ${available ? c.text : "text-muted-foreground"}`}>
                      {label}
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {description}
                    </p>
                  </div>
                  {!available && (
                    <span className="absolute top-2.5 right-2.5 rounded-full bg-muted px-2 py-0.5 text-[10px] text-muted-foreground">
                      Coming Soon
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
