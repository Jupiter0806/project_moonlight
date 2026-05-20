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
import { useRef, useState } from "react";
import { BiHeart, BiSolidHeart } from "react-icons/bi";
import { cn } from "@/lib/utils";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectTraceById, upsertTraces } from "@/store/slices/entitiesSlice";
import { updateTranslationTraceCorrection } from "@/lib/chamberTraceService";

interface DictionaryThisProps {
  text: string;
  language: string; // e.g., 'en-US', 'es-ES'
  traceId?: string;
}

export function DictionaryThis({
  text,
  language,
  traceId,
}: DictionaryThisProps) {
  const dispatch = useAppDispatch();
  const trace = useAppSelector((state) =>
    traceId ? selectTraceById(state, traceId) : undefined,
  );
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
  const latestRequestIdRef = useRef(0);
  const correctionRequestAbortRef = useRef<AbortController | null>(null);

  const activeDefinition =
    trace?.type === "translation" ? trace.correction : undefined;

  const handleToggleCorrection = async (definition: string) => {
    if (!trace || trace.type !== "translation") return;

    // Snapshot current correction so we can rollback if the request fails.
    const previousCorrection = trace.correction ?? null;
    // Exclusive selection: clicking the same definition again clears correction.
    const nextCorrection =
      previousCorrection === definition ? null : definition;
    // Monotonic request id lets us ignore stale responses that arrive late.
    const requestId = latestRequestIdRef.current + 1;
    latestRequestIdRef.current = requestId;

    // Latest-intent wins: cancel any previous correction update in flight.
    correctionRequestAbortRef.current?.abort();
    const abortController = new AbortController();
    correctionRequestAbortRef.current = abortController;

    dispatch(
      upsertTraces([
        {
          ...trace,
          correction: nextCorrection ?? undefined,
        },
      ]),
    );

    try {
      const response = await updateTranslationTraceCorrection(
        trace.id,
        nextCorrection,
        abortController.signal,
      );

      // Reconcile optimistic value with server-authoritative response.
      if (latestRequestIdRef.current === requestId) {
        dispatch(
          upsertTraces([
            {
              ...trace,
              correction: response.correction ?? undefined,
            },
          ]),
        );
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      // Roll back only if this is still the latest in-flight request.
      if (latestRequestIdRef.current === requestId) {
        dispatch(
          upsertTraces([
            {
              ...trace,
              correction: previousCorrection ?? undefined,
            },
          ]),
        );
      }
    } finally {
      if (correctionRequestAbortRef.current === abortController) {
        correctionRequestAbortRef.current = null;
      }
    }
  };

  return (
    <div>
      <IconButton
        accessibleLabel="Open dictionary"
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
        selectedDefinition={activeDefinition}
        onToggleDefinition={
          traceId
            ? (definition) => void handleToggleCorrection(definition)
            : undefined
        }
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
  selectedDefinition,
  onToggleDefinition,
}: {
  text: string;
  wordResult?: WordResult;
  open: boolean;
  onClose: () => void;
  isLoading?: boolean;
  selectedDefinition?: string;
  onToggleDefinition?: (definition: string) => void;
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
              {wordResult.results.map((entry) => (
                <li
                  key={entry.definition}
                  className="border-b pb-4 last:border-b-0"
                >
                  <span className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
                    {entry.partOfSpeech}
                  </span>
                  <div className="mt-1 flex items-start justify-between gap-3">
                    <p className="text-sm">{entry.definition}</p>
                    {onToggleDefinition && (
                      <IconButton
                        type="button"
                        size="icon-2xs"
                        variant="ghost"
                        className={cn(
                          "text-muted-foreground/60 hover:bg-muted/20 hover:text-muted-foreground",
                          selectedDefinition === entry.definition &&
                            "bg-muted/35 text-foreground/75 hover:bg-muted/40",
                        )}
                        icon={
                          selectedDefinition === entry.definition ? (
                            <BiSolidHeart />
                          ) : (
                            <BiHeart />
                          )
                        }
                        accessibleLabel={
                          selectedDefinition === entry.definition
                            ? "Unselect correction"
                            : "Select correction"
                        }
                        onClick={() => onToggleDefinition(entry.definition)}
                      />
                    )}
                  </div>
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
