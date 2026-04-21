import { useRef } from "react";
import { flushChamberTraces } from "@/lib/chamberTraceService";
import {
  clearTraceError,
  removeReflection,
  setReflectionFetchStatus,
  selectAllTraces,
  setTraceError,
  setTraceFetchStatus,
  upsertReflections,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  appendEntries,
  prependEntries,
  removeEntryByContentId,
  resetTimeline,
  replaceEntryByContentId,
  selectURTEntries,
} from "@/store/slices/urtSlice";
import type { Reflection } from "@/types/Reflection";

const REFLECTION_TIMELINE = "camphorReflections" as const;

export function useFlushChamberTraces() {
  const dispatch = useAppDispatch();
  const entries = useAppSelector(selectURTEntries("chamberTraces"));
  const allTraces = useAppSelector(selectAllTraces);
  const isFlushingRef = useRef(false);

  return async () => {
    if (entries.length === 0 || isFlushingRef.current) return;

    const chamberTraceIds = entries
      .filter((entry) => entry.type === "trace")
      .map((entry) => entry.content.id);

    if (chamberTraceIds.length === 0) return;

    const traceMap = new Map(allTraces.map((trace) => [trace.id, trace]));
    const tracesToFlush = chamberTraceIds
      .map((traceId) => traceMap.get(traceId))
      .filter((trace): trace is NonNullable<typeof trace> => Boolean(trace));

    if (tracesToFlush.length === 0) return;

    const previousEntries = [...entries];
    const previousTraces = tracesToFlush.map((trace) => ({ ...trace }));

    // Temporary local reflection id lets UI render instantly before server id arrives.
    const tempReflectionId = `temp-reflection-${crypto.randomUUID()}`;
    const optimisticTraces = previousTraces.map((trace) => ({
      ...trace,
      reflection: tempReflectionId,
    }));

    const optimisticReflection: Reflection = {
      id: tempReflectionId,
      createdAt: Date.now(),
      summary: "",
      user: previousTraces[0]?.user ?? "",
      entities: {
        traces: optimisticTraces,
      },
    };

    isFlushingRef.current = true;

    dispatch(resetTimeline("chamberTraces"));
    dispatch(upsertTraces(optimisticTraces));
    dispatch(upsertReflections([optimisticReflection]));
    dispatch(
      prependEntries({
        timeline: REFLECTION_TIMELINE,
        entries: [
          {
            type: "reflection",
            entryId: `entry-${tempReflectionId}`,
            content: { id: tempReflectionId, displayType: "reflection" },
          },
        ],
      }),
    );
    dispatch(
      setReflectionFetchStatus({ id: tempReflectionId, status: "loading" }),
    );

    optimisticTraces.forEach((trace) => {
      dispatch(setTraceFetchStatus({ id: trace.id, status: "loading" }));
    });

    try {
      const result = await flushChamberTraces();

      const flushedTraceIds = new Set(result.traceIds);
      const reconciledTraces = previousTraces.map((trace) =>
        flushedTraceIds.has(trace.id)
          ? { ...trace, reflection: result.reflectionId }
          : trace,
      );

      const settledReflection: Reflection = {
        id: result.reflectionId,
        createdAt: optimisticReflection.createdAt,
        summary: result.summary,
        user: optimisticReflection.user,
        entities: {
          traces: reconciledTraces,
        },
      };

      dispatch(upsertTraces(reconciledTraces));
      dispatch(upsertReflections([settledReflection]));
      dispatch(removeReflection({ id: tempReflectionId }));
      dispatch(
        setReflectionFetchStatus({ id: result.reflectionId, status: "done" }),
      );
      dispatch(
        replaceEntryByContentId({
          timeline: REFLECTION_TIMELINE,
          fromContentId: tempReflectionId,
          entry: {
            type: "reflection",
            entryId: `entry-${result.reflectionId}`,
            content: { id: result.reflectionId, displayType: "reflection" },
          },
        }),
      );

      reconciledTraces.forEach((trace) => {
        dispatch(setTraceFetchStatus({ id: trace.id, status: "done" }));
        dispatch(clearTraceError({ id: trace.id }));
      });
    } catch (error) {
      dispatch(
        appendEntries({ timeline: "chamberTraces", entries: previousEntries }),
      );
      dispatch(
        removeEntryByContentId({
          timeline: REFLECTION_TIMELINE,
          contentId: tempReflectionId,
        }),
      );
      dispatch(upsertTraces(previousTraces));
      dispatch(removeReflection({ id: tempReflectionId }));

      const message =
        error instanceof Error
          ? error.message
          : "Failed to flush chamber traces";

      previousTraces.forEach((trace) => {
        dispatch(setTraceFetchStatus({ id: trace.id, status: "error" }));
        dispatch(setTraceError({ id: trace.id, error: message }));
      });
    } finally {
      isFlushingRef.current = false;
    }
  };
}
