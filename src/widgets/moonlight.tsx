"use client";

import { MoonlightDisplayWidget } from "@/features/moonlight/moonlight-display-widget";
import { MoonlightEntryWidget } from "@/features/moonlight/moonlight-entry-widget";
import { useMoonlightView } from "@/features/moonlight/useMoonlightView";

export function Moonlight() {
  const {
    mode,
    isLoading,
    moonlight,
    error,
    canGenerateMoonlight,
    onGenerate,
  } = useMoonlightView();

  return (
    <div className="flex h-full w-full flex-col items-center p-6">
      {isLoading ? (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm leading-6">
            Close the day with a quick review and keep what matters in memory.
          </p>
          <p className="text-muted-foreground text-sm">
            Checking today&apos;s Moonlight...
          </p>
        </div>
      ) : moonlight ? (
        <MoonlightDisplayWidget moonlight={moonlight} />
      ) : (
        <MoonlightEntryWidget
          isLoading={isLoading}
          canGenerateMoonlight={canGenerateMoonlight}
          error={error}
          onGenerate={onGenerate}
          variant={mode === "history" ? "history" : "today"}
        />
      )}
    </div>
  );
}
