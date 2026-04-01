"use client";

import Link from "next/link";
import { ChevronLeft, LogOut } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function Header({ backHref, backLabel }: { backHref?: string; backLabel?: string } = {}) {
  const { user, logout } = useAuth();

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
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
          >
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
          </svg>
        </div>
        <span className="text-base font-semibold tracking-tight">
          AI for Subject Learning
        </span>
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
