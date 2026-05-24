"use client";

import { MoonlightDisplayWidget } from "@/features/moonlight/moonlight-display-widget";
import { MoonlightEntryWidget } from "@/features/moonlight/moonlight-entry-widget";
import { useMoonlightView } from "@/features/moonlight/useMoonlightView";

export function Moonlight() {
  const moonlightView = useMoonlightView();
  const selectedHistoryDate =
    moonlightView.mode === "history" ? moonlightView.selectedDate : undefined;

  return (
    <div className="flex h-full w-full flex-col items-center p-6">
      {moonlightView.isLoading ? (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm leading-6">
            Close the day with a quick review and keep what matters in memory.
          </p>
          <p className="text-muted-foreground text-sm">
            Checking today&apos;s Moonlight...
          </p>
        </div>
      ) : moonlightView.moonlight ? (
        <MoonlightDisplayWidget moonlight={moonlightView.moonlight} />
      ) : (
        <MoonlightEntryWidget
          isLoading={moonlightView.isLoading}
          canGenerateMoonlight={moonlightView.canGenerateMoonlight}
          error={moonlightView.error}
          onGenerate={moonlightView.onGenerate}
          variant={moonlightView.mode === "history" ? "history" : "today"}
          selectedDate={selectedHistoryDate}
        />
      )}
    </div>
  );
}
