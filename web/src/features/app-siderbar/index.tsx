import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { AppSidebarHeader } from "./components/app-sidebar-header";
import { AppSidebarFooter } from "./components/app-sidebar-footer";

export function AppSidebar() {
  return (
    <Sidebar>
      <AppSidebarHeader />

      <SidebarContent>
        <SidebarGroup />
        <SidebarGroup />
      </SidebarContent>

      <AppSidebarFooter />
    </Sidebar>
  );
}
