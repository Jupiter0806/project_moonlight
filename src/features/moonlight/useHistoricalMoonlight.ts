"use client";

import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { selectedMoonlightHistoryDateAtom } from "@/atoms/moonlight-history-atoms";
import {
  type MoonlightData,
  generateMoonlightByDate,
  getMoonlightByDate,
} from "@/lib/moonlight-service";

export type HistoricalMoonlightState = {
  selectedDate: string | null;
  isLoading: boolean;
  moonlight: MoonlightData | null;
  error: string | null;
  canGenerateMoonlight: boolean;
  onGenerate: () => Promise<void>;
};

export function useHistoricalMoonlight(): HistoricalMoonlightState {
  const selectedDate = useAtomValue(selectedMoonlightHistoryDateAtom);
  const date = selectedDate;
  const [isLoading, setIsLoading] = useState(false);
  const [moonlight, setMoonlight] = useState<MoonlightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canGenerateMoonlight, setCanGenerateMoonlight] = useState(false);

  useEffect(() => {
    if (!date) {
      setMoonlight(null);
      setError(null);
      setCanGenerateMoonlight(false);
      return;
    }
    // Capture a stable, non-null date for the async request closure.
    const historicalDate = date;

    const controller = new AbortController();

    async function loadHistoricalMoonlight() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getMoonlightByDate(
          historicalDate,
          controller.signal,
        );
        setMoonlight(data.exists && data.moonlight ? data.moonlight : null);
        setCanGenerateMoonlight(Boolean(data.canGenerate));
      } catch (e) {
        // Ignore state updates for requests canceled by dependency changes/unmount.
        if (!controller.signal.aborted) {
          const message =
            e instanceof Error
              ? e.message
              : "Failed to load selected moonlight";
          setError(message);
          setMoonlight(null);
          setCanGenerateMoonlight(false);
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadHistoricalMoonlight();

    return () => {
      controller.abort();
    };
  }, [date]);

  const onGenerate = async () => {
    if (!selectedDate) {
      return;
    }

    try {
      setError(null);
      const data = await generateMoonlightByDate(selectedDate);
      setMoonlight(data.moonlight);
      setCanGenerateMoonlight(false);
    } catch (e) {
      const message =
        e instanceof Error
          ? e.message
          : "Failed to generate selected moonlight";
      setError(message);
    }
  };

  return {
    selectedDate,
    isLoading,
    moonlight,
    error,
    canGenerateMoonlight,
    onGenerate,
  };
}
