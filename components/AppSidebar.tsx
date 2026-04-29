"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Clock, LogOut, MessageSquare, Sparkles, Variable, Zap } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/ui/sidebar";
import { useAuth } from "@/components/AuthProvider";
import { useToolbox, toolIconMap } from "@/contexts/ToolboxContext";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { basePath } from "@/lib/utils";

function ToolItem({
  toolKey,
  label,
  sub,
  icon,
  iconBg,
  isActive,
  onClick,
  groupLabel,
}: {
  toolKey: string;
  label: string;
  sub: string;
  icon: string;
  iconBg: string;
  isActive: boolean;
  onClick: () => void;
  groupLabel?: string;
}) {
  const Icon = toolIconMap[icon] ?? Variable;
  return (
    <Tooltip>
      <TooltipTrigger render={<SidebarMenuSubItem />}>
          <SidebarMenuSubButton
            onClick={onClick}
            isActive={isActive}
            className={`relative gap-2.5 ${
              isActive
                ? "bg-blue-50 text-blue-700 font-semibold ring-1 ring-blue-300 pl-3 hover:bg-blue-100 hover:text-blue-700 data-active:bg-blue-50 data-active:text-blue-700"
                : ""
            }`}
          >
            {isActive && (
              <span
                aria-hidden
                className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-r bg-blue-600"
              />
            )}
            <span
              className={`inline-flex items-center justify-center size-5 rounded-md ${iconBg} text-white shrink-0 ${
                isActive ? "ring-2 ring-blue-400" : ""
              }`}
            >
              <Icon className="size-3" strokeWidth={2.5} />
            </span>
            <span className="truncate text-xs">
              {groupLabel && (
                <span className="text-muted-foreground">{groupLabel} · </span>
              )}
              {label}
            </span>
          </SidebarMenuSubButton>
      </TooltipTrigger>
      <TooltipContent side="right" className="text-xs">
        {groupLabel && `${groupLabel} · `}{label} — {sub}
      </TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const { user, logout } = useAuth();
  const toolbox = useToolbox();
  const router = useRouter();
  const pathname = usePathname();
  const initials = user?.displayName?.charAt(0).toUpperCase() ?? "U";
  const logoSrc = `${basePath}/logo.png`.replace(/\/+$/g, "").replace(/([^:]\/)\/+/g, "$1") || "/logo.png";

  const tools = toolbox?.tools ?? [];
  const selectedTool = toolbox?.selectedTool ?? null;
  const question = toolbox?.question ?? "";
  const recommendedToolKeys = toolbox?.recommendedToolKeys ?? [];

  const allToolGroups = toolbox?.allToolGroups ?? [];
  const recommendedTools = tools.filter((t) => recommendedToolKeys.includes(t.key));

  // Build a map from tool key to its group label
  const toolGroupLabelMap: Record<string, string> = {};
  for (const group of allToolGroups) {
    for (const t of group.tools) {
      toolGroupLabelMap[t.key] = group.label;
    }
  }

  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img
            src={logoSrc}
            alt="AI Learning Platform logo"
            className="h-10 w-auto object-contain"
          />
          <span className="text-base font-semibold leading-tight">
            AI and Coding for Subject Learning
          </span>
        </Link>
        <Button
          className={`mt-4 w-full ${
            pathname.startsWith('/chinese/dashboard')
              ? 'bg-[#146ef5] text-white hover:bg-[#0055d4]'
              : ''
          }`}
          size="lg"
          onClick={() => {
          const subject = pathname.split('/')[1] || 'math';
          // On the math dashboard, just signal "new question" instead of navigating
          // (the dashboard will clear state and show the input form).
          if (subject === 'math' && pathname.startsWith('/math/dashboard')) {
            window.dispatchEvent(new CustomEvent('dashboard:new-question'));
            return;
          }
          // On the chinese dashboard, signal "new chat" to reset the chatbot.
          if (subject === 'chinese' && pathname.startsWith('/chinese/dashboard')) {
            window.dispatchEvent(new CustomEvent('dashboard:new-chat'));
            return;
          }
          router.push(`/${subject}`);
        }}>
          {pathname.startsWith('/chinese/dashboard') ? '+ New Chat' : '+ Add New Question'}
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">
        {/* AI Recommended Tools — only after a question is submitted */}
        {tools.length > 0 && question && (
          <SidebarGroup>
            <SidebarGroupLabel className="flex items-center gap-1.5">
              <Sparkles className="size-3.5" />
              AI 推薦工具
            </SidebarGroupLabel>
            {recommendedTools.length > 0 ? (
              <SidebarMenuSub>
                {recommendedTools.map((t) => (
                  <ToolItem
                    key={t.key}
                    toolKey={t.key}
                    label={t.label}
                    sub={t.sub}
                    icon={t.icon}
                    iconBg={t.iconBg}
                    isActive={selectedTool === t.key}
                    onClick={() => toolbox?.setSelectedTool(t.key)}
                    groupLabel={toolGroupLabelMap[t.key]}
                  />
                ))}
              </SidebarMenuSub>
            ) : (
              <p className="text-xs text-muted-foreground px-2 py-1 animate-pulse">
                正在分析題目...
              </p>
            )}
          </SidebarGroup>
        )}

        {/* All Tools grouped by type */}
        {allToolGroups.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>全部工具</SidebarGroupLabel>
            <SidebarMenu>
              {allToolGroups.map((group) => (
                <SidebarMenuItem key={group.label}>
                  <SidebarMenuButton className="text-xs font-medium text-muted-foreground pointer-events-none">
                    {group.label}
                  </SidebarMenuButton>
                  <SidebarMenuSub>
                    {group.tools.map((t) => (
                      <ToolItem
                        key={t.key}
                        toolKey={t.key}
                        label={t.label}
                        sub={t.sub}
                        icon={t.icon}
                        iconBg={t.iconBg}
                        isActive={selectedTool === t.key}
                        onClick={() => toolbox?.setSelectedTool(t.key)}
                      />
                    ))}
                  </SidebarMenuSub>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="p-3 space-y-2">
        {/* History trigger */}
        <Sheet>
          <SheetTrigger
            render={
              <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-xs" />
            }
          >
            <Clock className="size-3.5" />
            歷史記錄
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="px-4 pt-4 pb-2">
              <SheetTitle className="flex items-center gap-2 text-sm">
                <Clock className="size-4" />
                歷史記錄
              </SheetTitle>
              <SheetDescription className="text-xs">
                過去的提問記錄
              </SheetDescription>
            </SheetHeader>
            <Separator />
            <div className="flex-1 overflow-y-auto px-2 py-2">
              {question ? (
                <div className="space-y-1">
                  <button className="flex items-start gap-2.5 w-full rounded-lg px-3 py-2.5 text-left hover:bg-muted transition-colors">
                    <MessageSquare className="size-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-medium leading-snug line-clamp-2 prose prose-sm max-w-none [&_p]:m-0">
                        <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[[rehypeKatex, { strict: false }]]}>
                          {question}
                        </ReactMarkdown>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">剛剛</p>
                    </div>
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Clock className="size-8 mb-2 opacity-30" />
                  <p className="text-xs">暫無記錄</p>
                </div>
              )}
            </div>
          </SheetContent>
        </Sheet>

        {/* User info */}
        <Separator />
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col flex-1 min-w-0">
            <span className="text-sm truncate">{user?.displayName ?? "用戶"}</span>
            {user && (
              <span className="text-xs text-muted-foreground capitalize">
                {user.role === "teacher" ? "教師" : "學生"}
              </span>
            )}
          </div>
          {user && (
            <button
              onClick={logout}
              title="登出"
              className="ml-auto inline-flex items-center rounded-md p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <LogOut className="size-4" />
            </button>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
