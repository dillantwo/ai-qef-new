"use client";

import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { basePath } from "@/lib/utils";

export default function Header({ backHref, backLabel }: { backHref?: string; backLabel?: string } = {}) {
  const { user, logout } = useAuth();
  const logoSrc = `${basePath}/logo.png`.replace(/\/+$/g, "").replace(/([^:]\/)\/+/g, "$1") || "/logo.png";

  return (
    <header className="flex items-center justify-between px-6 py-3 border-b border-border bg-background">
      <div className="flex items-center gap-2">
        {backHref && (
          <Link
            href={backHref}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors mr-1"
          >
            <ChevronLeft className="size-4" />
            {backLabel ?? "返回"}
          </Link>
        )}
        <Link href="/" className="inline-flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src={logoSrc}
            alt="AI Learning Platform logo"
            className="h-9 w-auto object-contain"
          />
          <span className="text-base font-semibold tracking-tight">
            AI and Coding for Subject Learning
          </span>
        </Link>
      </div>

      {user && (
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {user.displayName}
            <span className="ml-1.5 inline-flex items-center rounded-full border border-border bg-muted px-2 py-0.5 text-xs font-medium capitalize">
              {user.role === "teacher" ? "教師" : "學生"}
            </span>
          </span>
          <button
            onClick={logout}
            title="登出"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LogOut className="size-4" />
            <span className="hidden sm:inline">登出</span>
          </button>
        </div>
      )}
    </header>
  );
}
