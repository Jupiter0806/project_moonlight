import { AppSidebarTrigger } from "../app-siderbar/app-sidebar-trigger";
import { IoCheckmark } from "react-icons/io5";
import { HeaderIcon } from "./components/header-icon";

const AvoidHeaderSpacingClassname = "mt-16";

export function AppHeaderPlaceholder() {
  return <div className={`${AvoidHeaderSpacingClassname}`} />;
}

export function AppHeader() {
  return (
    <div className="bg-background fixed z-10 flex w-full items-center justify-between">
      <LeftActions />
      <Title />
      <RightActions />
    </div>
  );
}

function Title() {
  return <div className="text-lg font-semibold">Chamber</div>;
}

function LeftActions() {
  return (
    <div className="flex gap-2">
      <AppSidebarTrigger />
    </div>
  );
}

function RightActions() {
  return (
    <div className="flex min-w-0.5 gap-2">
      {/* Future actions like user profile, settings, etc. */}
      <HeaderIcon
        icon={<IoCheckmark />}
        accessibleLabel="Submit"
        // onClick={() => alert("Header action clicked!")}
      />
    </div>
  );
}
