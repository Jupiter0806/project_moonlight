import { AppHeaderPlaceholder } from "@/features/app-header/app-header";

export function Camphor() {
  return (
    <div className="flex h-full w-full flex-col">
      <AppHeaderPlaceholder />
      <div>
        <h1 className="text-2xl font-bold">Camphor</h1>
      </div>
    </div>
  );
}
