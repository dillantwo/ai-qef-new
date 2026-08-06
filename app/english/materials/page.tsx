"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FileText, Link2, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import { basePath } from "@/lib/utils";

interface MaterialItem {
  id: string;
  title: string;
  description: string;
  audience: string;
  filename: string;
  contentType: string;
  size: number;
}

interface MaterialGroup {
  name: string;
  items: MaterialItem[];
}

export default function EnglishMaterialsPage() {
  const [groups, setGroups] = useState<MaterialGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch(`${basePath}/api/learning-materials?subject=english`);
        if (!res.ok) {
          if (active) setError("無法載入學習資源，請稍後再試。");
          return;
        }
        const data = await res.json();
        if (active) setGroups(data.groups ?? []);
      } catch {
        if (active) setError("無法載入學習資源，請稍後再試。");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const allCollapsed = groups.length > 0 && groups.every((g) => collapsed.has(g.name));

  function toggleGroup(name: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function toggleAll() {
    setCollapsed(allCollapsed ? new Set() : new Set(groups.map((g) => g.name)));
  }

  return (
    <>
      <Header backHref="/english" backLabel="English" />

      <main className="relative flex flex-1 items-start overflow-y-auto overflow-x-hidden bg-white text-[#080808]">
        <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <div className="space-y-2">
            <p className="text-[12px] font-semibold uppercase tracking-[1.2px] text-[#9aa39c]">
              Learning Materials
            </p>
            <h1 className="text-[32px] leading-[1.04] font-semibold tracking-[-0.03em] text-[#080808]">
              學習資源下載
            </h1>
            <p className="text-sm leading-7 text-[#5a5a5a]">
              下載英文科的補充教材、工作紙與參考資源。
            </p>
          </div>

          <div className="mt-8 flex-1">
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="size-6 animate-spin text-[#16a34a]" />
              </div>
            ) : error ? (
              <p className="rounded-[10px] border border-[#f0c2c2] bg-[#fdf3f3] px-4 py-3 text-sm text-[#b42318]">
                {error}
              </p>
            ) : groups.length === 0 ? (
              <div className="rounded-[12px] border border-dashed border-[#d8d8d8] bg-white py-20 text-center">
                <FileText className="mx-auto size-8 text-[#c9c9c9]" />
                <p className="mt-3 text-sm text-[#5a5a5a]">目前尚無可下載的資源。</p>
              </div>
            ) : (
              <div className="space-y-5">
                {groups.map((group, index) => {
                  const isCollapsed = collapsed.has(group.name);
                  return (
                    <section
                      key={group.name}
                      className="overflow-hidden rounded-[12px] border border-[#e3e6e3] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
                    >
                      <div className="flex items-center justify-between gap-4 px-5 py-4">
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.name)}
                          className="flex flex-1 items-center gap-2.5 text-left"
                          aria-expanded={!isCollapsed}
                        >
                          <ChevronDown
                            className={[
                              "size-6 shrink-0 text-[#16a34a] transition-transform duration-200",
                              isCollapsed ? "-rotate-90" : "",
                            ].join(" ")}
                          />
                          <span className="text-[22px] font-semibold tracking-[-0.01em] text-[#1f2a24]">
                            {group.name}
                          </span>
                        </button>

                        {index === 0 && (
                          <button
                            type="button"
                            onClick={toggleAll}
                            className="shrink-0 text-[15px] font-medium text-[#16a34a] transition-colors hover:text-[#0f7a37]"
                          >
                            {allCollapsed ? "Expand all" : "Collapse all"}
                          </button>
                        )}
                      </div>

                      {!isCollapsed && (
                        <ul>
                          {group.items.map((m) => (
                            <li key={m.id} className="border-t border-[#eef1ee]">
                              <a
                                href={`${basePath}/api/learning-materials/${m.id}/download`}
                                className="flex items-start gap-3 px-5 py-4 transition-colors hover:bg-[#f6faf7]"
                                title={m.filename}
                              >
                                <Link2 className="mt-0.5 size-5 shrink-0 text-[#3aa0c9]" />
                                <span className="min-w-0">
                                  <span className="block text-[18px] font-medium leading-snug text-[#16a34a]">
                                    {m.title}
                                  </span>
                                  {m.description && (
                                    <span className="mt-1 block text-sm leading-6 text-[#8a938c]">
                                      {m.description}
                                    </span>
                                  )}
                                </span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </section>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
