"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import {
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
    icon: Calculator,
    href: "/math",
    available: true,
  },
  {
    id: "chinese",
    label: "中國語文科",
    labelEn: "Chinese Language",
    icon: BookOpen,
    href: "/chinese",
    available: true,
  },
  {
    id: "english",
    label: "英國英文科",
    labelEn: "English Language",
    icon: Globe,
    href: "/english",
    available: true,
  },
  {
    id: "science",
    label: "科學科",
    labelEn: "Science",
    icon: FlaskConical,
    href: "/science",
    available: false,
  },
  {
    id: "humanities",
    label: "人文科",
    labelEn: "Humanities",
    icon: Landmark,
    href: "/humanities",
    available: false,
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

      <main className="flex flex-1 flex-col items-center justify-center px-4">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10">
          {/* Heading */}
          <div className="text-center space-y-3">
            <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
              請選擇科目
            </h1>
            <p className="text-muted-foreground text-lg">
              選擇您想學習的科目，AI將為您提供針對性的輔導。
            </p>
          </div>

          {/* Subject Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {subjects.map(({ id, label, labelEn, icon: Icon }) => (
                <div
                  key={id}
                  className="flex flex-col items-center gap-4 rounded-2xl border border-border/50 bg-muted/30 p-8 text-center opacity-70 animate-pulse"
                >
                  <div className="flex size-16 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                    <Icon className="size-8" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold">{label}</p>
                    <p className="text-sm text-muted-foreground">{labelEn}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
            {subjects.map(({ id, label, labelEn, icon: Icon, href, available }) => {
              const hasAccess = userSubjects.includes(id as import("@/models/User").Subject);
              const enabled = available && hasAccess;
              return (
              <button
                key={id}
                onClick={() => enabled && router.push(href)}
                disabled={!enabled}
                className={[
                  "group relative flex flex-col items-center gap-4 rounded-2xl border p-8 text-center transition-all duration-200",
                  enabled
                    ? "border-border bg-background hover:border-primary hover:shadow-md hover:-translate-y-0.5 cursor-pointer"
                    : "border-border/50 bg-muted/30 cursor-not-allowed opacity-50",
                ].join(" ")}
              >
                <div
                  className={[
                    "flex size-16 items-center justify-center rounded-2xl transition-colors",
                    enabled
                      ? "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  ].join(" ")}
                >
                  <Icon className="size-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-semibold">{label}</p>
                  <p className="text-sm text-muted-foreground">{labelEn}</p>
                </div>
                {!available && (
                  <span className="absolute top-3 right-3 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    即將推出
                  </span>
                )}
                {available && !hasAccess && (
                  <span className="absolute top-3 right-3 rounded-full bg-destructive/10 text-destructive px-2 py-0.5 text-xs">
                    無權限
                  </span>
                )}
              </button>
              );
            })}
          </div>
          )}
        </div>
      </main>
    </>
  );
}
