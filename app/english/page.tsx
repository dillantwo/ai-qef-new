"use client";

import { useRouter } from "next/navigation";
import { Compass, ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

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

const colorMap: Record<string, { ring: string; gradient: string; badge: string; arrow: string }> = {
  blue: {
    ring: "ring-blue-200 dark:ring-blue-800",
    gradient: "from-blue-100 to-blue-50 dark:from-blue-950/60 dark:to-blue-900/30",
    badge: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
    arrow: "text-blue-600 dark:text-blue-400",
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
                <Card
                  key={id}
                  className={[
                    "group relative cursor-pointer transition-all duration-200",
                    available
                      ? `bg-gradient-to-br ${c.gradient} ${c.ring} hover:shadow-lg hover:-translate-y-0.5`
                      : "opacity-50 cursor-not-allowed",
                  ].join(" ")}
                  onClick={() => available && router.push(`/english/dashboard?topic=${id}`)}
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex size-12 items-center justify-center rounded-full bg-white/80 dark:bg-white/10 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                        <Icon className="size-6 text-blue-600 dark:text-blue-400" strokeWidth={1.8} />
                      </div>
                      {!available && (
                        <Badge variant="secondary" className="text-[10px]">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-base mt-1">{label}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                  </CardHeader>
                  {available && (
                    <CardContent className="pt-0">
                      <span className={`inline-flex items-center gap-1 text-xs font-medium ${c.arrow} group-hover:gap-2 transition-all`}>
                        Start learning
                        <ArrowRight className="size-3.5" />
                      </span>
                    </CardContent>
                  )}
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </>
  );
}
