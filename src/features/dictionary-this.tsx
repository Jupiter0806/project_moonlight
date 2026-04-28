"use client";

import { useQuery } from "@tanstack/react-query";
import { TiBook } from "react-icons/ti";
import { IconButton } from "@/components/icon-button";
import { fetchWordData, WordResult } from "@/lib/wordsService";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useState } from "react";

interface DictionaryThisProps {
  text: string;
  language: string; // e.g., 'en-US', 'es-ES'
}

export function DictionaryThis({ text, language }: DictionaryThisProps) {
  const {
    data: wordResult,
    isLoading,
    refetch: fetchDic,
  } = useQuery({
    queryKey: ["dictionary", text, language],
    queryFn: () => fetchWordData(text),
    enabled: false, // Don't run automatically
    staleTime: Infinity,
    retry: false,
  });

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div>
      <IconButton
        accessibleLabel="Play"
        data-testid="play-button"
        loading={isLoading}
        icon={<TiBook />}
        onClick={() => {
          if (!wordResult) {
            fetchDic();
          }
          setIsDrawerOpen(true);
        }}
      />
      <DictionaryDrawer
        text={text}
        wordResult={wordResult}
        open={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        isLoading={isLoading}
      />
    </div>
  );
}

function DictionaryDrawer({
  text,
  wordResult,
  open,
  onClose,
  isLoading,
}: {
  text: string;
  wordResult?: WordResult;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
}) {
  return (
    <Drawer open={open} onClose={onClose}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{text}</DrawerTitle>
        </DrawerHeader>
        <div className="overflow-y-auto px-4 pb-6">
          {isLoading && <p>Loading...</p>}
          {wordResult && (
            <ul className="space-y-4">
              {wordResult.results.map((entry, index) => (
                <li key={index} className="border-b pb-4 last:border-b-0">
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {entry.partOfSpeech}
                  </span>
                  <p className="mt-1 text-sm">{entry.definition}</p>
                  {entry.examples && entry.examples.length > 0 && (
                    <ul className="mt-2 space-y-1">
                      {entry.examples.map((example, i) => (
                        <li
                          key={i}
                          className="text-muted-foreground text-sm italic"
                        >
                          &ldquo;{example}&rdquo;
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
