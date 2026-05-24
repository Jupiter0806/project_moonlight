"use client";

import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";

import { selectedMoonlightHistoryDateAtom } from "@/atoms/moonlight-history-atoms";
import {
  type MoonlightData,
  getMoonlightByDate,
} from "@/lib/moonlight-service";

export type HistoricalMoonlightState = {
  selectedDate: string | null;
  isLoading: boolean;
  moonlight: MoonlightData | null;
  error: string | null;
  hasReflections: boolean;
};

export function useHistoricalMoonlight(): HistoricalMoonlightState {
  const selectedDate = useAtomValue(selectedMoonlightHistoryDateAtom);
  const [isLoading, setIsLoading] = useState(false);
  const [moonlight, setMoonlight] = useState<MoonlightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasReflections, setHasReflections] = useState(true);

  useEffect(() => {
    if (!selectedDate) {
      setMoonlight(null);
      setError(null);
      setHasReflections(true);
      return;
    }

    const controller = new AbortController();

    async function loadHistoricalMoonlight() {
      setIsLoading(true);
      setError(null);

      try {
        const data = await getMoonlightByDate(selectedDate, controller.signal);
        setMoonlight(data.exists && data.moonlight ? data.moonlight : null);
        setHasReflections(data.exists);
      } catch (e) {
        if (!controller.signal.aborted) {
          const message =
            e instanceof Error
              ? e.message
              : "Failed to load selected moonlight";
          setError(message);
          setMoonlight(null);
          setHasReflections(false);
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
  }, [selectedDate]);

  return {
    selectedDate,
    isLoading,
    moonlight,
    error,
    hasReflections,
  };
}
