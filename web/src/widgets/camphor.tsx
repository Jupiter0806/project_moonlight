import { AppHeaderPlaceholder } from "@/features/app-header/app-header";
import { CamphorReflectionList } from "@/features/camphor/camphor-reflection-list";

export function Camphor() {
  return (
    <div className="flex h-full w-full flex-col">
      <AppHeaderPlaceholder />
      <div className="flex-1 p-4">
        <CamphorReflectionList />
      </div>
    </div>
  );
}
