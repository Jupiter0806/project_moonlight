import { MoonlightReflectionList } from "@/features/moonlight/moonlight-reflection-list";

export function Moonlight() {
  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex-1 p-4">
        <MoonlightReflectionList />
      </div>
    </div>
  );
}
