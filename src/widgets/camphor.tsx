import { CamphorReflectionList } from "@/features/camphor/camphor-reflection-list";

export function Camphor() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="min-h-0 flex-1 p-4">
        <CamphorReflectionList />
      </div>
    </div>
  );
}
