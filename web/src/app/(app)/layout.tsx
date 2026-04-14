import { AppSidebar } from "@/features/app-siderbar";
import { AppSidebarTrigger } from "@/features/app-siderbar/app-sidebar-trigger";
import { Page } from "@/components/Page/Page";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Page>
        <AppSidebarTrigger />
        {children}
      </Page>
    </SidebarProvider>
  );
}
