"use client";

import { useMemo } from "react";

import { useHistoricalMoonlight } from "@/features/moonlight/useHistoricalMoonlight";
import { useTodayMoonlight } from "@/features/moonlight/useTodayMoonlight";

type MoonlightViewState =
  | {
      mode: "today";
      isLoading: boolean;
      moonlight: ReturnType<typeof useTodayMoonlight>["moonlight"];
      error: string | null;
      canGenerateMoonlight: boolean;
      onGenerate: () => Promise<void>;
    }
  | {
      mode: "history";
      selectedDate: string;
      isLoading: boolean;
      moonlight: ReturnType<typeof useHistoricalMoonlight>["moonlight"];
      error: string | null;
      canGenerateMoonlight: false;
      onGenerate: () => Promise<void>;
    };

const noopGenerate = async () => {};

export function useMoonlightView(): MoonlightViewState {
  const today = useTodayMoonlight();
  const history = useHistoricalMoonlight();

  return useMemo(() => {
    if (history.selectedDate) {
      return {
        mode: "history" as const,
        selectedDate: history.selectedDate,
        isLoading: history.isLoading,
        moonlight: history.moonlight,
        error: history.error,
        canGenerateMoonlight: false,
        onGenerate: noopGenerate,
      };
    }

    return {
      mode: "today" as const,
      isLoading: today.isLoading,
      moonlight: today.moonlight,
      error: today.error,
      canGenerateMoonlight: today.canGenerateMoonlight,
      onGenerate: today.onGenerate,
    };
  }, [history, today]);
}
