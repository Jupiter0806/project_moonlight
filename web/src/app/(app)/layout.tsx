import { AppSidebar } from "@/features/app-siderbar";
import { Page } from "@/components/Page/Page";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppHeader } from "@/features/app-header/app-header";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Page>
        <AppHeader />
        {children}
      </Page>
    </SidebarProvider>
  );
}
