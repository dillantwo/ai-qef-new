"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Compass, Landmark, Route, Sparkles } from "lucide-react";
import Header from "@/components/Header";
import { Badge } from "@/components/ui/badge";

const topics = [
  {
    id: "location-direction",
    label: "Location and Direction",
    subtitle: "Map Language Lab",
    description: "Practice prepositional phrases through map-based direction tasks and structured speaking prompts.",
    icon: Route,
    color: "#146ef5",
    available: true,
  },
  {
    id: "daily-routines",
    label: "Daily Routines",
    subtitle: "Sequence and Time Expressions",
    description: "Build fluency with present simple sentence flow, connectors, and routine storytelling frames.",
    icon: Landmark,
    color: "#00d722",
    available: false,
  },
  {
    id: "travel-conversations",
    label: "Travel Conversations",
    subtitle: "Functional Speaking",
    description: "Train quick response patterns for asking, confirming, and clarifying in real-world scenarios.",
    icon: Compass,
    color: "#ff6b00",
    available: false,
  },
];

export default function EnglishPage() {
  const router = useRouter();
  const readyCount = topics.filter((topic) => topic.available).length;

  function navigateToTopic(topicId: string, available: boolean) {
    if (!available) return;
    router.push(`/english/dashboard?topic=${topicId}`);
  }

  return (
    <>
      <Header backHref="/" backLabel="選科目" />

      <main className="relative flex flex-1 overflow-hidden bg-white text-[#080808]">
        <div className="absolute inset-0 bg-[linear-gradient(165deg,_#ffffff_0%,_#f7fbff_52%,_#ffffff_100%)]" />
        <div className="absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top,_rgba(20,110,245,0.14),_transparent_48%)]" />
        <div className="absolute right-0 top-20 h-56 w-56 translate-x-1/4 rounded-full bg-[#146ef5]/10 blur-3xl" />

        <div className="relative mx-auto flex w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="flex w-full flex-col gap-10 py-2">
            <section className="grid gap-8 border-b border-[#d8d8d8] px-2 pb-8 pt-4 sm:px-0 lg:grid-cols-[minmax(0,1.2fr)_320px] lg:items-end">
              <div className="space-y-5">
                <p className="text-[12px] font-semibold uppercase tracking-[1.5px] text-[#146ef5]">
                  English topic studio
                </p>
                <div className="space-y-3">
                  <h1 className="max-w-4xl text-[42px] leading-[1.02] font-semibold tracking-[-0.04em] text-[#080808] sm:text-[54px] lg:text-[68px]">
                    Choose your English
                    <br className="hidden sm:block" />
                    learning track
                  </h1>
                  <p className="max-w-2xl text-base leading-7 text-[#4f4f4f] sm:text-lg">
                    This page is your English-only topic gateway. Start from map language now, and unlock more communication modules as they are released.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center rounded-[4px] bg-[#146ef5]/10 px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#146ef5]">
                    English only
                  </span>
                  <span className="inline-flex items-center rounded-[4px] border border-[#d8d8d8] bg-white px-3 py-2 text-[12px] font-semibold uppercase tracking-[1px] text-[#080808]">
                    {readyCount} topic ready
                  </span>
                </div>
              </div>

              <aside className="rounded-[8px] border border-[#d8d8d8] bg-white/90 p-5 shadow-[rgba(0,0,0,0)_0px_84px_24px,rgba(0,0,0,0.01)_0px_54px_22px,rgba(0,0,0,0.04)_0px_30px_18px,rgba(0,0,0,0.08)_0px_13px_13px,rgba(0,0,0,0.09)_0px_3px_7px] backdrop-blur-sm">
                <p className="text-[10px] font-semibold uppercase tracking-[1.2px] text-[#ababab]">
                  Session guide
                </p>
                <div className="mt-4 space-y-4 text-sm leading-6 text-[#4f4f4f]">
                  <p>Begin with map navigation language and directional phrases.</p>
                  <p>Use the dashboard tasks to practice describing routes with precision.</p>
                  <p>Coming modules will expand into routines and travel communication.</p>
                </div>
              </aside>
            </section>

            <section className="grid gap-4 px-2 sm:px-0 md:grid-cols-2 xl:grid-cols-3">
              {topics.map(({ id, label, subtitle, description, icon: Icon, color, available }) => (
                <button
                  key={id}
                  onClick={() => navigateToTopic(id, available)}
                  disabled={!available}
                  className={[
                    "group relative flex min-h-[320px] flex-col overflow-hidden rounded-[8px] border p-6 text-left transition duration-200",
                    available
                      ? "cursor-pointer border-[#d8d8d8] bg-white hover:translate-x-[6px] hover:-translate-y-[2px] hover:border-[#080808]"
                      : "cursor-not-allowed border-[#d8d8d8] bg-[#f3f3f1]",
                  ].join(" ")}
                >
                  <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full blur-2xl" style={{ backgroundColor: `${color}22` }} />

                  <div className="relative flex items-center justify-between gap-4">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-[4px] text-white shadow-[6px_6px_0px_#080808]"
                      style={{ backgroundColor: color }}
                    >
                      <Icon className="size-5" />
                    </div>
                    {available ? (
                      <Badge className="rounded-[4px] border-0 bg-[#146ef5]/10 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1px] text-[#146ef5]">
                        Live
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="rounded-[4px] border-0 bg-[#080808]/8 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[1px] text-[#5a5a5a]">
                        Coming soon
                      </Badge>
                    )}
                  </div>

                  <div className="relative mt-10 space-y-4">
                    <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#ababab]">
                      {subtitle}
                    </p>
                    <h2 className="text-[32px] leading-[1.04] font-semibold tracking-[-0.03em] text-[#080808]">
                      {label}
                    </h2>
                    <p className="text-sm leading-7 text-[#5a5a5a]">
                      {description}
                    </p>
                  </div>

                  <div className="relative mt-auto border-t border-[#d8d8d8] pt-5">
                    {available ? (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#080808] transition-transform duration-200 group-hover:translate-x-[6px]">
                        Start this topic
                        <ArrowRight className="size-4 text-[#146ef5]" />
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm font-medium text-[#5a5a5a]">
                        Waiting for release
                        <Sparkles className="size-4 text-[#7a3dff]" />
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
