import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ToolboxProvider } from "@/contexts/ToolboxContext";

export default function MathDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ToolboxProvider>
      <SidebarProvider>
        <AppSidebar />
        <main className="flex flex-1 flex-col min-h-0 overflow-hidden">{children}</main>
      </SidebarProvider>
    </ToolboxProvider>
  );
}
