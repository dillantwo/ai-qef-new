"use client";

import { useEffect, useState } from "react";
import { Loader2, Wrench } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { basePath } from "@/lib/utils";

interface AdminTool {
  key: string;
  label: string;
  sub: string;
  icon: string;
  isActive: boolean;
}

interface AdminToolboxGroup {
  id: string;
  type: string;
  label: string;
  description: string;
  isActive: boolean;
  tools: AdminTool[];
}

function Toggle({
  on,
  disabled,
  onClick,
}: {
  on: boolean;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      disabled={disabled}
      onClick={onClick}
      className={
        "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50 " +
        (on ? "bg-primary" : "bg-muted-foreground/30")
      }
    >
      <span
        className={
          "inline-block size-5 transform rounded-full bg-white shadow transition-transform " +
          (on ? "translate-x-5" : "translate-x-0.5")
        }
      />
    </button>
  );
}

export default function AdminToolboxPage() {
  const [groups, setGroups] = useState<AdminToolboxGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/admin/toolbox`);
      setGroups(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function patch(
    body: { type: string; toolKey?: string; isActive: boolean },
    pendingKey: string
  ) {
    setError(null);
    setPending((prev) => new Set(prev).add(pendingKey));
    try {
      const res = await fetch(`${basePath}/api/admin/toolbox`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "更新失敗");
        return;
      }
      // Optimistically update local state.
      setGroups((prev) =>
        prev.map((g) => {
          if (g.type !== body.type) return g;
          if (body.toolKey) {
            return {
              ...g,
              tools: g.tools.map((t) =>
                t.key === body.toolKey ? { ...t, isActive: body.isActive } : t
              ),
            };
          }
          return { ...g, isActive: body.isActive };
        })
      );
    } finally {
      setPending((prev) => {
        const next = new Set(prev);
        next.delete(pendingKey);
        return next;
      });
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">工具管理</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          控制各科工具是否對老師與學生顯示。關閉的群組或工具會即時從前台隱藏，資料不會被刪除。
        </p>
      </div>

      {error && (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-4 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : groups.length === 0 ? (
        <p className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
          尚無工具群組。請先執行 seed-toolbox 腳本。
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => {
            const groupPending = pending.has(g.type);
            return (
              <div key={g.id} className="overflow-hidden rounded-lg border bg-background">
                <div className="flex items-center justify-between gap-4 border-b bg-muted/40 px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Wrench className="size-4 text-muted-foreground" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{g.label}</span>
                        <Badge variant={g.isActive ? "default" : "outline"}>
                          {g.isActive ? "上線" : "隱藏"}
                        </Badge>
                      </div>
                      <p className="mt-0.5 text-xs text-muted-foreground">{g.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {groupPending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
                    <Toggle
                      on={g.isActive}
                      disabled={groupPending}
                      onClick={() => patch({ type: g.type, isActive: !g.isActive }, g.type)}
                    />
                  </div>
                </div>

                <ul className="divide-y">
                  {g.tools.map((t) => {
                    const toolPendingKey = `${g.type}:${t.key}`;
                    const toolPending = pending.has(toolPendingKey);
                    const effectiveOff = !g.isActive || !t.isActive;
                    return (
                      <li
                        key={t.key}
                        className="flex items-center justify-between gap-4 px-4 py-2.5 pl-11"
                      >
                        <div className={effectiveOff ? "opacity-60" : ""}>
                          <p className="text-sm font-medium">{t.label}</p>
                          <p className="text-xs text-muted-foreground">{t.sub}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {!g.isActive && (
                            <span className="text-xs text-muted-foreground">群組已隱藏</span>
                          )}
                          {toolPending && (
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                          )}
                          <Toggle
                            on={t.isActive}
                            disabled={toolPending || !g.isActive}
                            onClick={() =>
                              patch(
                                { type: g.type, toolKey: t.key, isActive: !t.isActive },
                                toolPendingKey
                              )
                            }
                          />
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
