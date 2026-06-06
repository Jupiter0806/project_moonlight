"use client";

import { useAtom } from "jotai";
import { marginaliaInputAtom } from "../atom/marginalia-input-atoms";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTraceError,
  setTraceError,
  setTraceFetchStatus,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import { appendEntries } from "@/store/slices/urtSlice";
import {
  selectActiveUserId,
  selectIsLoggedIn,
} from "@/store/slices/sessionSlice";
import type { MarginaliaTrace } from "@/types/Trace";
import { upsertChamberTrace } from "@/lib/chamberTraceService";
import { applyChamberTraceSyncSuccess } from "@/features/traces/hooks/chamberTraceSync";

export function useFlushMarginalia(): () => void {
  const [value, setValue] = useAtom(marginaliaInputAtom);
  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectActiveUserId);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return () => {
    if (!value.trim()) return;

    const id = crypto.randomUUID();

    const trace: MarginaliaTrace = {
      id,
      createdAt: Date.now(),
      q: value,
      a: "",
      user: userId,
      reflection: "",
      liked: null,
      type: "marginalia",
    };

    dispatch(upsertTraces([trace]));

    dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [
          {
            type: "trace",
            entryId: `entry-${id}`,
            content: { id, displayType: "marginalia-trace" },
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
        .then(({ cursor }) => {
          applyChamberTraceSyncSuccess(dispatch, id, cursor);
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

    setValue("");
  };
}
