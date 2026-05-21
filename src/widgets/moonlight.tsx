"use client";

import { useCallback, useEffect, useState } from "react";
import {
  type MoonlightData,
  generateTodayMoonlight,
  getTodayMoonlight,
} from "@/lib/moonlight-service";
import { MoonlightDisplayWidget } from "@/features/moonlight/moonlight-display-widget";
import { MoonlightEntryWidget } from "@/features/moonlight/moonlight-entry-widget";

export function Moonlight() {
  const [isLoading, setIsLoading] = useState(true);
  const [moonlight, setMoonlight] = useState<MoonlightData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTodayMoonlight = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const data = await getTodayMoonlight();

      setMoonlight(data.exists && data.moonlight ? data.moonlight : null);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to load today's moonlight";
      setError(message);
      setMoonlight(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTodayMoonlight();
  }, [loadTodayMoonlight]);

  const handleGenerate = useCallback(async () => {
    try {
      const data = await generateTodayMoonlight();
      setMoonlight(data.moonlight);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to generate today's moonlight";
      setError(message);
    }
  }, []);

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
          error={error}
          onGenerate={handleGenerate}
        />
      )}
    </div>
  );
}
