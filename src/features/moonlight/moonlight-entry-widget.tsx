"use client";

import { Button } from "@/components/ui/button";
import { useState, useCallback } from "react";

export function MoonlightEntryWidget({
  isLoading,
  error,
  onGenerate,
}: {
  isLoading: boolean;
  error: string | null;
  onGenerate: () => void;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

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
          Checking today&apos;s Moonlight...
        </p>
      ) : (
        <Button
          size="lg"
          className="min-w-52"
          disabled={isGenerating}
          onClick={handleGenerate}
        >
          {isGenerating ? "Generating Moonlight..." : "Let&apos;s Do Moonlight"}
        </Button>
      )}

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
