"use client";

import Link from "next/link";
import { PanelLeft, Settings, Zap } from "lucide-react";
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
} from "@/components/ui/sidebar";

export function AppSidebar() {
  return (
    <Sidebar>
      <SidebarHeader className="p-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-primary-foreground">
            <Zap className="size-5" />
          </div>
          <span className="text-base font-semibold leading-tight">
            AI Mathematics
          </span>
        </Link>
        <Button className="mt-4 w-full" size="lg">
          + Add New Question
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-4">
        <p className="text-xs text-muted-foreground mb-2">Qestion</p>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              test
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <div className="flex items-center gap-2">
          <Avatar className="size-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              U
            </AvatarFallback>
          </Avatar>
          <span className="text-sm">Settings</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
