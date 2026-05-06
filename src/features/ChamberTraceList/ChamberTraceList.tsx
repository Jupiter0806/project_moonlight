"use client";

import { List } from "@/components/list";
/**
 *
 * - TODO: map over answers from state/atoms and render each answer card
 * - TODO: auto-scroll to the latest answer when new content arrives
 * - TODO: preserve scroll position when the keyboard opens/closes
 */

import { Trace } from "../traces/trace";
import { useGetTimelineQuery } from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";
import { NewTracesBar } from "./components/new-traces-bar";
import { TracesUpdatesListener } from "./components/traces-updates-listener";

export function ChamberTraceList() {
  const traces = useTraceList();
  const fetchStatus = useAppSelector(selectURTFetchStatus("chamberTraces"));

  return (
    <List isLoading={fetchStatus === "loading"}>
      <TracesUpdatesListener />
      {traces.map((trace) =>
        trace.type === "timeline-cursor" ? null : (
          <Trace
            key={trace.entryId}
            traceId={trace.content.id}
            displayType={trace.content.displayType}
          />
        ),
      )}
      <NewTracesBar />
    </List>
  );
}

function useTraceList() {
  // RTK Query: handles fetching, caching, and deduplication automatically.
  // On fulfilled, urtSlice + entitiesSlice both update via extraReducers/matchers.
  // todo: it's a good idea to put fetch and subscription in one single hook
  // what happens when users come back to the page after a while?
  // will the fetch be triggered again
  useGetTimelineQuery({
    timeline: "chamberTraces",
    direction: "bottom",
  });

  return useAppSelector(selectURTEntries("chamberTraces"));
}
