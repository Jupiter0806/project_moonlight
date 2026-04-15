"use client";

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { audioServer } from "@/lib/audioServer";
import { IoPlayOutline } from "react-icons/io5";
import { IconButton } from "@/components/icon-button";

interface SpeechThisProps {
  text: string;
  language: string; // e.g., 'en-US', 'es-ES'
}

export function SpeechThis({ text, language }: SpeechThisProps) {
  const {
    data: audioContent,
    isLoading,
    refetch: fetchAudioContent,
  } = useQuery({
    queryKey: ["speech", text, language],
    queryFn: () =>
      fetch(
        `/api/speech/${encodeURIComponent(text)}?languageCode=${encodeURIComponent(language)}`,
      )
        .then((res) => res.json())
        .then((data) => {
          playAudio(data.audioContent);
          return data.audioContent;
        }),
    enabled: false, // Don't run automatically
    staleTime: Infinity,
  });

  const playAudio = useCallback((audioContent: string) => {
    audioServer.play(audioContent);
  }, []);

  return (
    <IconButton
      accessibleLabel="Play"
      data-testid="play-button"
      loading={isLoading}
      icon={<IoPlayOutline />}
      onClick={() => {
        if (audioContent) {
          playAudio(audioContent);
        } else {
          fetchAudioContent();
        }
      }}
    />
  );
}
