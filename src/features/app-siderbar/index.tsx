import { Sidebar, SidebarContent, SidebarGroup } from "@/components/ui/sidebar";
import { AppSidebarHeader } from "./components/app-sidebar-header";
import { AppSidebarFooter } from "./components/app-sidebar-footer";
import { AppSidebarNav } from "./components/app-sidebar-nav";
import { useAtom } from "jotai";

export function AppSidebar() {
  return (
    <Sidebar>
      <AppSidebarHeader />

      <SidebarContent>
        <AppSidebarNav />
      </SidebarContent>

      <AppSidebarFooter />
    </Sidebar>
  );
}
