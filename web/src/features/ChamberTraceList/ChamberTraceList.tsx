"use client";

/**
 *
 * - TODO: map over answers from state/atoms and render each answer card
 * - TODO: auto-scroll to the latest answer when new content arrives
 * - TODO: preserve scroll position when the keyboard opens/closes
 */

import { Trace } from "../Trace";
import { useGetTimelineQuery } from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";

export function ChamberTraceList() {
  const traces = useTraceList();
  const fetchStatus = useAppSelector(selectURTFetchStatus("chamberTraces"));

  return (
    <div className="flex h-full flex-col gap-4 overflow-y-auto">
      {fetchStatus === "loading" && (
        <div className="flex items-center justify-center">
          <p className="text-sm">Loading traces...</p>
        </div>
      )}
      {traces.map((trace) => (
        <Trace
          key={trace.entryId}
          traceId={trace.content.id}
          displayType={trace.content.displayType}
        />
      ))}
    </div>
  );
}

function useTraceList() {
  // RTK Query: handles fetching, caching, and deduplication automatically.
  // On fulfilled, urtSlice + entitiesSlice both update via extraReducers/matchers.
  useGetTimelineQuery({ timeline: "chamberTraces", direction: "bottom" });

  return useAppSelector(selectURTEntries("chamberTraces"));
}
