import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ToolboxProvider } from "@/contexts/ToolboxContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function MathDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolboxProvider>
      <SidebarProvider>
        <AppSidebar />
        <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
          <header className="flex items-center justify-between border-b border-border px-4 py-2">
            <div className="flex items-center gap-1">
              <SidebarTrigger />
              <Link
                href="/math"
                className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <ChevronLeft className="size-4" />
                返回數學科
              </Link>
            </div>
            <Avatar className="size-8">
              <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                U
              </AvatarFallback>
            </Avatar>
          </header>
          <main className="flex flex-1 flex-col min-h-0 overflow-hidden">{children}</main>
        </div>
      </SidebarProvider>
    </ToolboxProvider>
  );
}
