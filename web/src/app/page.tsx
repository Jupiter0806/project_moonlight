import { AppSidebar } from "@/features/app-siderbar";
import { Page } from "@/components/Page/Page";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { Chamber } from "@/widgets/Chamber/Chamber";
import { AppSidebarTrigger } from "@/features/app-siderbar/app-sidebar-trigger";

export default function Home() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <Page>
        <AppSidebarTrigger />
        <Chamber />
      </Page>
    </SidebarProvider>
  );
}
