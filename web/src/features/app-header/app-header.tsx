import { AppSidebarTrigger } from "../app-siderbar/app-sidebar-trigger";
import { HeaderTitle } from "./components/header-title";
import { HeaderRightActionButtons } from "./components/header-right-action-btns";

const AvoidHeaderSpacingClassname = "mt-16";

export function AppHeaderPlaceholder() {
  return <div className={`${AvoidHeaderSpacingClassname}`} />;
}

export function AppHeader() {
  return (
    <div className="bg-background fixed z-10 flex w-full items-center justify-between">
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
