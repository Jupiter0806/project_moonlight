"use client";

import { useAtom, useAtomValue } from "jotai";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTraceError,
  setTraceError,
  setTraceFetchStatus,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import { prependEntries } from "@/store/slices/urtSlice";
import {
  sourceLanguageAtom,
  sourceTextAtom,
  targetLanguageAtom,
  translationResultAtom,
} from "../atom/translateAtoms";
import {
  selectActiveUserId,
  selectIsLoggedIn,
} from "@/store/slices/sessionSlice";
import { LanguageKey } from "@/lib/languages";
import type { TranslationTrace } from "@/types/Trace";
import { upsertChamberTrace } from "@/lib/chamberTraceService";

/**
 * Returns a flush function that:
 *  1. Creates a local Trace from the current sourceText + translationResult
 *  2. Upserts it into entitiesSlice (traces normalised store)
 *  3. Prepends a URTEntry into the chamberTraces timeline
 *  4. Clears both atoms
 *
 * No-ops if either source text or translation result is empty — the user
 * should wait for the translation to complete before flushing.
 */
export function useFlushTranslation(): () => void {
  const [sourceText, setSourceText] = useAtom(sourceTextAtom);
  const [translationResult, setTranslationResult] = useAtom(
    translationResultAtom,
  );
  const sourceLang = useAtomValue(sourceLanguageAtom);
  const targetLang = useAtomValue(targetLanguageAtom);
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectActiveUserId);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return () => {
    if (!sourceText.trim() || !translationResult.trim()) return;

    const id = crypto.randomUUID();

    const trace: TranslationTrace = {
      id,
      createdAt: Date.now(),
      q: sourceText,
      a: translationResult,
      user: userId,
      reflection: "",
      type: "translation",
      sourceLang: sourceLang.key as LanguageKey,
      targetLang: targetLang.key as LanguageKey,
    };

    dispatch(upsertTraces([trace]));

    dispatch(
      prependEntries({
        timeline: "chamberTraces",
        entries: [
          {
            type: "trace",
            entryId: `entry-${id}`,
            content: { id, displayType: "translation-trace" },
          },
        ],
      }),
    );

    if (!isLoggedIn) {
      dispatch(setTraceFetchStatus({ id, status: "error" }));
      dispatch(
        setTraceError({
          id,
          error: "Sign in to sync traces to your chamber.",
        }),
      );
    } else {
      dispatch(clearTraceError({ id }));
      dispatch(setTraceFetchStatus({ id, status: "loading" }));

      void upsertChamberTrace(trace)
        .then(() => {
          dispatch(setTraceFetchStatus({ id, status: "done" }));
          dispatch(clearTraceError({ id }));
        })
        .catch((error) => {
          dispatch(setTraceFetchStatus({ id, status: "error" }));
          dispatch(
            setTraceError({
              id,
              error:
                error instanceof Error ? error.message : "Failed to sync trace",
            }),
          );
        });
    }

    setSourceText("");
    setTranslationResult("");
  };
}
