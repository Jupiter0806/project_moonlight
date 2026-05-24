"use client";

import { useSetAtom } from "jotai";

import { selectedMoonlightHistoryDateAtom } from "@/atoms/moonlight-history-atoms";
import { Button } from "@/components/ui/button";
import { MoonlightDisplayWidget } from "@/features/moonlight/moonlight-display-widget";
import { MoonlightEntryWidget } from "@/features/moonlight/moonlight-entry-widget";
import { useMoonlightView } from "@/features/moonlight/useMoonlightView";

function formatHistoryDateLabel(isoDate: string): string {
  const [yearText, monthText, dayText] = isoDate.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (
    !Number.isFinite(year) ||
    !Number.isFinite(month) ||
    !Number.isFinite(day)
  ) {
    return isoDate;
  }

  const date = new Date(year, month - 1, day, 12, 0, 0, 0);
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function Moonlight() {
  const moonlightView = useMoonlightView();
  const clearSelectedHistoryDate = useSetAtom(selectedMoonlightHistoryDateAtom);
  const selectedHistoryDate =
    moonlightView.mode === "history" ? moonlightView.selectedDate : undefined;
  const selectedHistoryDateLabel = selectedHistoryDate
    ? formatHistoryDateLabel(selectedHistoryDate)
    : null;

  return (
    <div className="flex h-full w-full flex-col items-center p-6">
      {moonlightView.mode === "history" ? (
        <div className="mb-4 w-full max-w-xl">
          <Button
            variant="ghost"
            className="px-0 text-sm"
            onClick={() => clearSelectedHistoryDate(null)}
          >
            Go back to today
          </Button>
        </div>
      ) : null}

      {moonlightView.isLoading ? (
        <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
          <p className="text-muted-foreground text-sm leading-6">
            Close the day with a quick review and keep what matters in memory.
          </p>
          <p className="text-muted-foreground text-sm">
            {moonlightView.mode === "history" && selectedHistoryDateLabel
              ? `Checking Moonlight for ${selectedHistoryDateLabel}...`
              : "Checking today's Moonlight..."}
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
