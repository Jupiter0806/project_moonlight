"use client";

import { VirtualList } from "@/components/virtual-list";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDynamicRowHeight, useListRef } from "react-window";
import { Trace } from "../traces/trace";
import { useGetTimelineQuery } from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectNewReflectionsBar,
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";
import type { URTEntryUI } from "@/store/types";
import { NewTracesBar } from "./components/new-traces-bar";
import { TracesUpdatesListener } from "./components/traces-updates-listener";

/**
 *
 * - TODO: preserve scroll position when the keyboard opens/closes
 */

const NEW_TRACES_BAR_ITEM = { type: "new-traces-bar" } as const;

type ChamberTraceRowItem = URTEntryUI | typeof NEW_TRACES_BAR_ITEM;

export function ChamberTraceList() {
  const traces = useTraceList();
  const fetchStatus = useAppSelector(selectURTFetchStatus("chamberTraces"));
  const newTracesCount =
    useAppSelector(selectNewReflectionsBar("chamberTraces"))?.count ?? 0;
  const listRef = useListRef(null);
  const rowHeight = useDynamicRowHeight({ defaultRowHeight: 160 });
  const previousTraceCountRef = useRef(0);
  const previousNewTracesCountRef = useRef(0);
  const hasMountedRef = useRef(false);
  const didInitialScrollRef = useRef(false);

  const traceEntries = useMemo(
    () =>
      traces.filter(
        (trace): trace is URTEntryUI => trace.type !== "timeline-cursor",
      ),
    [traces],
  );

  const items = useMemo<ChamberTraceRowItem[]>(
    () =>
      newTracesCount > 0
        ? [...traceEntries, NEW_TRACES_BAR_ITEM]
        : traceEntries,
    [newTracesCount, traceEntries],
  );

  const scrollToBottom = useCallback(() => {
    const run = (attempt: number) => {
      if (items.length === 0) return;

      listRef.current?.scrollToRow({
        index: items.length - 1,
        align: "end",
        behavior: "auto",
      });

      // Dynamic row heights settle over multiple frames as cards mount and
      // measure. Repeat a few times to converge on the true bottom.
      if (attempt < 6) {
        requestAnimationFrame(() => {
          run(attempt + 1);
        });
      }
    };

    run(0);
  }, [items.length, listRef]);

  // scroll to bottom once data is ready
  // this happens on first load, or when navigating back to the page after visiting another page
  // (because the data is cached and fetchStatus goes from "idle" to "fulfilled" immediately)
  // for first load, its functionality overlaps with the next useEffect
  useEffect(() => {
    if (didInitialScrollRef.current) return;
    if (fetchStatus === "loading") return;
    if (items.length === 0) return;

    scrollToBottom();

    didInitialScrollRef.current = true;
  }, [fetchStatus, items.length, listRef, scrollToBottom]);

  // any items changed, new items bar appears
  useEffect(() => {
    const hasNewTrace = traceEntries.length > previousTraceCountRef.current;
    const didNewTracesBarAppear =
      previousNewTracesCountRef.current === 0 && newTracesCount > 0;

    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
    } else if ((hasNewTrace || didNewTracesBarAppear) && items.length > 0) {
      scrollToBottom();
    }

    previousTraceCountRef.current = traceEntries.length;
    previousNewTracesCountRef.current = newTracesCount;
  }, [
    items.length,
    listRef,
    newTracesCount,
    scrollToBottom,
    traceEntries.length,
  ]);

  return (
    <>
      <TracesUpdatesListener />
      <VirtualList
        className="h-full"
        items={items}
        isLoading={fetchStatus === "loading"}
        listRef={listRef}
        rowHeight={rowHeight}
        emptyState={
          <div className="flex h-full items-center justify-center">
            <p className="text-muted-foreground text-sm">No traces yet.</p>
          </div>
        }
        renderRow={(item, index) => {
          if (item.type === "new-traces-bar") {
            return <NewTracesBar />;
          }

          return (
            <div className={index < items.length - 1 ? "pb-4" : undefined}>
              <Trace
                traceId={item.content.id}
                displayType={item.content.displayType}
              />
            </div>
          );
        }}
      />
    </>
  );
}

function useTraceList() {
  // RTK Query: handles fetching, caching, and deduplication automatically.
  // On fulfilled, urtSlice + entitiesSlice both update via extraReducers/matchers.

  useGetTimelineQuery({
    timeline: "chamberTraces",
    direction: "bottom",
  });

  return useAppSelector(selectURTEntries("chamberTraces"));
}
