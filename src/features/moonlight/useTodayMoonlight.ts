"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  type MoonlightData,
  generateTodayMoonlight,
  getTodayMoonlight,
} from "@/lib/moonlight-service";

export type TodayMoonlightState = {
  isLoading: boolean;
  moonlight: MoonlightData | null;
  error: string | null;
  canGenerateMoonlight: boolean;
  onGenerate: () => Promise<void>;
};

export function useTodayMoonlight(): TodayMoonlightState {
  const [isLoading, setIsLoading] = useState(true);
  const [moonlight, setMoonlight] = useState<MoonlightData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 60_000);

    return () => {
      clearInterval(timer);
    };
  }, []);

  const canGenerateMoonlight = useMemo(() => now.getHours() >= 22, [now]);

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
    if (!canGenerateMoonlight) {
      setError(
        "Moonlight opens at 10:00 PM. Keep learning and come back tonight.",
      );
      return;
    }

    try {
      const data = await generateTodayMoonlight();
      setMoonlight(data.moonlight);
    } catch (e) {
      const message =
        e instanceof Error ? e.message : "Failed to generate today's moonlight";
      setError(message);
    }
  }, [canGenerateMoonlight]);

  return {
    isLoading,
    moonlight,
    error,
    canGenerateMoonlight,
    onGenerate: handleGenerate,
  };
}
