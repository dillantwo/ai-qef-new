import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex flex-1 flex-col min-h-0 overflow-hidden">
        <header className="flex items-center justify-between border-b border-border px-4 py-2">
          <SidebarTrigger />
          <Avatar className="size-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              U
            </AvatarFallback>
          </Avatar>
        </header>
        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">{children}</main>
      </div>
    </SidebarProvider>
  );
}
