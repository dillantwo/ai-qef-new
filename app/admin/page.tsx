"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Loader2, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { basePath } from "@/lib/utils";

interface SchoolRow {
  id: string;
  name: string;
  code: string;
  enabledSubjects: string[];
  active: boolean;
  userCount: number;
}

export default function AdminOverviewPage() {
  const [schools, setSchools] = useState<SchoolRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${basePath}/api/admin/schools`)
      .then((r) => (r.ok ? r.json() : []))
      .then(setSchools)
      .catch(() => setSchools([]))
      .finally(() => setLoading(false));
  }, []);

  const totalUsers = schools.reduce((sum, s) => sum + s.userCount, 0);
  const activeSchools = schools.filter((s) => s.active).length;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">總覽</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          管理學校、老師與學生的科目存取權限。
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" /> 學校總數
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{schools.length}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Building2 className="size-4" /> 啟用中學校
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{activeSchools}</CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-muted-foreground">
                  <Users className="size-4" /> 使用者總數
                </CardTitle>
              </CardHeader>
              <CardContent className="text-3xl font-semibold">{totalUsers}</CardContent>
            </Card>
          </div>

          <div className="flex gap-3">
            <Link
              href="/admin/schools"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              管理學校
            </Link>
            <Link
              href="/admin/users"
              className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              管理使用者
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
