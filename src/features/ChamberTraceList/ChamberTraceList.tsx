"use client";

import { List } from "@/components/list";
/**
 *
 * - TODO: map over answers from state/atoms and render each answer card
 * - TODO: auto-scroll to the latest answer when new content arrives
 * - TODO: preserve scroll position when the keyboard opens/closes
 */

import { Trace } from "../traces/trace";
import {
  useGetTimelineQuery,
  useLazyGetChamberUpdatesQuery,
} from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectURTEntries,
  selectURTFetchStatus,
  selectChamberUpdatesCursor,
} from "@/store/slices/urtSlice";
import { useEffect, useRef } from "react";
import { NewTracesBar } from "./components/new-traces-bar";

export function ChamberTraceList() {
  const traces = useTraceList();
  const fetchStatus = useAppSelector(selectURTFetchStatus("chamberTraces"));

  useTraceUpdates();

  console.log("ChamberTraceList render", { traces, fetchStatus });

  return (
    <List isLoading={fetchStatus === "loading"}>
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

function useTraceUpdates() {
  const [triggerUpdates] = useLazyGetChamberUpdatesQuery();

  // Mirror the selector into a ref so the single running loop always reads
  // the latest cursor without needing to restart when it advances.
  const updatesCursor = useAppSelector(selectChamberUpdatesCursor);
  const updatesCursorRef = useRef<string | null>(null);

  const cursorFetchStatus = useAppSelector(
    selectURTFetchStatus("chamberTraces", updatesCursor?.content.value),
  );
  const cursorFetchStatusRef = useRef<string | null>(null);

  useEffect(() => {
    updatesCursorRef.current = updatesCursor?.content.value ?? null;
  }, [updatesCursor]);

  useEffect(() => {
    cursorFetchStatusRef.current = cursorFetchStatus;
  }, [cursorFetchStatus]);

  useEffect(() => {
    let active = true;
    // Holds the current in-flight RTK Query subscription so we can call
    // .abort() on it, which cancels the underlying fetch on the server side.
    let currentRequest: ReturnType<typeof triggerUpdates> | null = null;

    const runLongPollLoop = async () => {
      while (active) {
        if (!updatesCursorRef.current) {
          await new Promise((resolve) => setTimeout(resolve, 200));
          continue;
        }

        try {
          // The server already holds the connection for up to waitMs (8s),
          // polling Firestore every POLL_STEP_MS (4s) internally. There is no
          // need to add a client-side sleep on top — the server response itself
          // is the delay. Re-poll immediately after each response so latency
          // is bounded by the server's hold window alone.
          currentRequest = triggerUpdates({
            cursor: updatesCursorRef.current,
            waitMs: 8000,
          });

          const response = await currentRequest.unwrap();
          if (
            response.newReflectionsBar &&
            response.newReflectionsBar?.count > 0
          )
            // once retrieved data, sleep for a while to wait new cursor updated
            await new Promise((resolve) => setTimeout(resolve, 200));
        } catch {
          if (!active) return;
          // Avoid tight error loops when network/auth temporarily fails.
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    void runLongPollLoop();

    return () => {
      active = false;
      // Aborts the in-flight fetch — signal flows through queryFn → getChamberUpdates → fetch().
      currentRequest?.abort();
    };
  }, [triggerUpdates]);
}
