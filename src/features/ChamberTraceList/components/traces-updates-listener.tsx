import { useLazyGetChamberUpdatesQuery } from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import { selectChamberUpdatesCursor } from "@/store/slices/urtSlice";
import { useEffect, useRef } from "react";

export function TracesUpdatesListener() {
  useTraceUpdates();

  return null;
}

function useTraceUpdates() {
  const [triggerUpdates] = useLazyGetChamberUpdatesQuery();

  // Mirror the selector into a ref so the single running loop always reads
  // the latest cursor without needing to restart when it advances.
  const updatesCursor = useAppSelector(selectChamberUpdatesCursor);
  const updatesCursorRef = useRef<string | null>(null);
  const activeRequestRef = useRef<ReturnType<typeof triggerUpdates> | null>(
    null,
  );
  const prevCursorRef = useRef<string | null>(null);

  useEffect(() => {
    const nextCursor = updatesCursor?.content.value ?? null;
    const prevCursor = prevCursorRef.current;

    updatesCursorRef.current = nextCursor;

    // If the boundary cursor advances (e.g. local flush got a newer cursor),
    // cancel the in-flight long-poll started from the old cursor.
    if (prevCursor && nextCursor && prevCursor !== nextCursor) {
      activeRequestRef.current?.abort();
    }

    prevCursorRef.current = nextCursor;
  }, [updatesCursor]);

  useEffect(() => {
    let active = true;

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
          const request = triggerUpdates({
            cursor: updatesCursorRef.current,
            waitMs: 8000,
          });
          activeRequestRef.current = request;

          const response = await request.unwrap();
          activeRequestRef.current = null;
          if (
            response.newReflectionsBar &&
            response.newReflectionsBar?.count > 0
          )
            // once retrieved data, sleep for a while to wait new cursor updated
            await new Promise((resolve) => setTimeout(resolve, 200));
        } catch (error) {
          activeRequestRef.current = null;
          if (!active) return;

          if (
            typeof error === "object" &&
            error !== null &&
            "name" in error &&
            (error as { name?: string }).name === "AbortError"
          ) {
            continue;
          }

          // Avoid tight error loops when network/auth temporarily fails.
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }
      }
    };

    void runLongPollLoop();

    return () => {
      active = false;
      // Aborts the in-flight fetch — signal flows through queryFn → getChamberUpdates → fetch().
      activeRequestRef.current?.abort();
    };
  }, [triggerUpdates]);
}
