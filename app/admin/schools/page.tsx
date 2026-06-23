"use client";

import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { SUBJECTS, SUBJECT_LABELS } from "@/lib/subjects";
import { basePath } from "@/lib/utils";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  enabledSubjects: string[];
  active: boolean;
  userCount: number;
}

export default function SchoolsPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SchoolRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [active, setActive] = useState(true);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/admin/schools`);
      setSchools(res.ok ? await res.json() : []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    setName("");
    setCode("");
    setSubjects([]);
    setActive(true);
    setError(null);
    setDialogOpen(true);
  }

  function openEdit(s: SchoolRow) {
    setEditing(s);
    setName(s.name);
    setCode(s.code);
    setSubjects(s.enabledSubjects);
    setActive(s.active);
    setError(null);
    setDialogOpen(true);
  }

  function toggleSubject(value: string) {
    setSubjects((prev) =>
      prev.includes(value) ? prev.filter((s) => s !== value) : [...prev, value]
    );
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      const isEdit = Boolean(editing);
      const url = isEdit
        ? `${basePath}/api/admin/schools/${editing!.id}`
        : `${basePath}/api/admin/schools`;
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code, enabledSubjects: subjects, active }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "儲存失敗");
        return;
      }
      setDialogOpen(false);
      await load();
    } finally {
      setSaving(false);
    }
  }

  async function remove(s: SchoolRow) {
    if (!confirm(`確定刪除「${s.name}」？此操作無法復原。`)) return;
    const res = await fetch(`${basePath}/api/admin/schools/${s.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? "刪除失敗");
      return;
    }
    await load();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">學校管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            建立學校並設定該校開通的科目。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" /> 新增學校
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : schools.length === 0 ? (
        <p className="rounded-md border border-dashed py-16 text-center text-sm text-muted-foreground">
          尚未建立任何學校。
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border bg-background">
          <table className="w-full text-sm">
            <thead className="border-b bg-muted/50 text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">學校</th>
                <th className="px-4 py-3 font-medium">代碼</th>
                <th className="px-4 py-3 font-medium">開通科目</th>
                <th className="px-4 py-3 font-medium">使用者</th>
                <th className="px-4 py-3 font-medium">狀態</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {schools.map((s) => (
                <tr key={s.id} className="border-b last:border-0 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium">{s.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{s.code}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {s.enabledSubjects.length === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        s.enabledSubjects.map((sub) => (
                          <Badge key={sub} variant="secondary">
                            {SUBJECT_LABELS[sub] ?? sub}
                          </Badge>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{s.userCount}</td>
                  <td className="px-4 py-3">
                    <Badge variant={s.active ? "default" : "outline"}>
                      {s.active ? "啟用" : "停用"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" size="sm" onClick={() => openEdit(s)}>
                        編輯
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => remove(s)}
                        aria-label="刪除"
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "編輯學校" : "新增學校"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">學校名稱</label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="例如：聖保羅書院" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">學校代碼</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="例如：spc（建立後不可更改）"
                disabled={Boolean(editing)}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">開通科目</label>
              <div className="flex flex-wrap gap-2">
                {SUBJECTS.map((s) => {
                  const on = subjects.includes(s.value);
                  return (
                    <button
                      key={s.value}
                      type="button"
                      onClick={() => toggleSubject(s.value)}
                      className={
                        "rounded-md border px-3 py-1.5 text-sm transition-colors " +
                        (on
                          ? "border-primary bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted")
                      }
                    >
                      {s.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
              />
              啟用學校
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>

          <DialogFooter className="flex-row justify-end gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={save} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              儲存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
