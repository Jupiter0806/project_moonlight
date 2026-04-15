"use client";

import { useAtom, useAtomValue } from "jotai";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { upsertTraces } from "@/store/slices/entitiesSlice";
import { prependEntries } from "@/store/slices/urtSlice";
import {
  sourceLanguageAtom,
  sourceTextAtom,
  targetLanguageAtom,
  translationResultAtom,
} from "../atom/translateAtoms";
import { selectActiveUserId } from "@/store/slices/sessionSlice";
import { LanguageKey } from "@/lib/languages";

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

  return () => {
    if (!sourceText.trim() || !translationResult.trim()) return;

    const id = crypto.randomUUID();

    dispatch(
      upsertTraces([
        {
          id,
          created_at: Date.now(),
          q: sourceText,
          a: translationResult,
          user: userId,
          reflection: "",
          type: "translation",
          sourceLang: sourceLang.key as LanguageKey,
          targetLang: targetLang.key as LanguageKey,
        },
      ]),
    );

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

    setSourceText("");
    setTranslationResult("");
  };
}
