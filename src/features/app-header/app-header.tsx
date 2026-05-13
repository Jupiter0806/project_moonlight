import { AppSidebarTrigger } from "../app-siderbar/app-sidebar-trigger";
import { HeaderTitle } from "./components/header-title";
import { HeaderRightActionButtons } from "./components/header-right-action-btns";

export function AppHeader() {
  return (
    <div className="bg-background sticky top-0 z-10 flex h-16 w-full items-center justify-between">
      <LeftActions />
      <HeaderTitle />
      <HeaderRightActionButtons />
    </div>
  );
}

function LeftActions() {
  return (
    <div className="flex gap-2">
      <AppSidebarTrigger />
    </div>
  );
}
