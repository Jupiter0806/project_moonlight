import { SidebarHeader } from "@/components/ui/sidebar";
import { ThemeToggle } from "@/features/theme-toggle";

export function AppSidebarHeader() {
  return (
    <SidebarHeader>
      <ThemeToggle />
    </SidebarHeader>
  );
}
