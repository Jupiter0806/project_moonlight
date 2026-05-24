"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

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

export function MoonlightEntryWidget({
  isLoading,
  canGenerateMoonlight,
  error,
  onGenerate,
  variant = "today",
  selectedDate,
}: {
  isLoading: boolean;
  canGenerateMoonlight: boolean;
  error: string | null;
  onGenerate: () => Promise<void>;
  variant?: "today" | "history";
  selectedDate?: string;
}) {
  const [isGenerating, setIsGenerating] = useState(false);
  const selectedHistoryDateLabel =
    variant === "history" && selectedDate
      ? formatHistoryDateLabel(selectedDate)
      : null;

  const handleGenerate = useCallback(async () => {
    setIsGenerating(true);
    try {
      await onGenerate();
    } finally {
      setIsGenerating(false);
    }
  }, [onGenerate]);

  return (
    <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 text-center">
      <p className="text-muted-foreground text-sm leading-6">
        Close the day with a quick review and keep what matters in memory.
      </p>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">
          {variant === "history" && selectedHistoryDateLabel
            ? `Checking Moonlight for ${selectedHistoryDateLabel}...`
            : "Checking today's Moonlight..."}
        </p>
      ) : canGenerateMoonlight ? (
        <Button
          size="lg"
          className="min-w-52"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {variant === "history" && selectedHistoryDateLabel
            ? isGenerating
              ? `Generating Moonlight for ${selectedHistoryDateLabel}...`
              : `Generate Moonlight for ${selectedHistoryDateLabel}`
            : isGenerating
              ? "Generating Moonlight..."
              : "Let's Do Moonlight"}
        </Button>
      ) : variant === "history" ? (
        <p className="text-muted-foreground text-sm leading-6">
          No reflections, unable to generate.
        </p>
      ) : (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm leading-6">
            Moonlight becomes available after 10:00 PM, once your day has had
            time to fully unfold.
          </p>
          <p className="text-muted-foreground text-sm leading-6">
            Keep exploring, asking questions, and collecting reflections.
            Tonight&apos;s summary will be richer because of what you learn now.
          </p>
        </div>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
