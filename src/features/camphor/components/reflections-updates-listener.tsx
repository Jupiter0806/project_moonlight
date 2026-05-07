"use client";

import { useGetTimelineQuery } from "@/store/api/timelineApi";
import {
  upsertReflections,
  upsertTraces,
  upsertUsers,
} from "@/store/slices/entitiesSlice";
import { appendNewEntriesBar } from "@/store/slices/urtSlice";
import { useAppDispatch } from "@/store/hooks";
import type { TimelineApiResponse } from "@/store/types";
import { useEffect, useRef } from "react";

const RECONNECT_DELAY_MS = 1000;

type UpdatesPayload = TimelineApiResponse & {
  nextCursor?: string;
};

export function ReflectionsUpdatesListener() {
  useReflectionUpdates();

  return null;
}

function useReflectionUpdates() {
  const dispatch = useAppDispatch();
  const initialTopCursor = useGetTimelineQuery({
    timeline: "camphorReflections",
    direction: "bottom",
  }).data?.topCursor;

  const cursorRef = useRef<string | undefined>(initialTopCursor);

  useEffect(() => {
    if (!cursorRef.current && initialTopCursor) {
      cursorRef.current = initialTopCursor;
    }
  }, [initialTopCursor]);

  useEffect(() => {
    let active = true;
    let eventSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

    const connect = () => {
      if (!active) return;

      const params = new URLSearchParams({ limit: "20" });
      if (cursorRef.current) {
        params.set("cursor", cursorRef.current);
      }

      eventSource = new EventSource(
        `/api/reflections/updates?${params.toString()}`,
      );

      eventSource.addEventListener("updates", (event) => {
        const payload = JSON.parse(
          (event as MessageEvent<string>).data,
        ) as UpdatesPayload;

        if (payload.traces.length > 0) {
          dispatch(upsertTraces(payload.traces));
        }
        if (payload.reflections.length > 0) {
          dispatch(upsertReflections(payload.reflections));
        }
        if (payload.users.length > 0) {
          dispatch(upsertUsers(payload.users));
        }

        const newBar = payload.newReflectionsBar;
        if (newBar && newBar.count > 0) {
          dispatch(
            appendNewEntriesBar({
              timeline: "camphorReflections",
              bar: newBar,
            }),
          );
        }

        if (payload.nextCursor) {
          cursorRef.current = payload.nextCursor;
        }
      });

      eventSource.onerror = () => {
        eventSource?.close();
        eventSource = null;

        if (!active) return;

        reconnectTimer = setTimeout(() => {
          connect();
        }, RECONNECT_DELAY_MS);
      };
    };

    connect();

    return () => {
      active = false;
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      eventSource?.close();
    };
  }, [dispatch]);
}
