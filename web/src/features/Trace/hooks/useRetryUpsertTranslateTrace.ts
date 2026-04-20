import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectIsLoggedIn } from "@/store/slices/sessionSlice";
import { upsertChamberTrace } from "@/lib/chamberTraceService";
import {
  clearTraceError,
  setTraceError,
  setTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import { Trace } from "@/types/Trace";

export function useRetryUpsertTranslateTrace(
  trace: Trace | undefined,
): () => void {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return async () => {
    if (!trace || trace.type === "qa") return;

    if (!isLoggedIn) {
      dispatch(setTraceFetchStatus({ id: trace.id, status: "error" }));
      dispatch(
        setTraceError({
          id: trace.id,
          error: "Sign in to sync traces to your chamber.",
        }),
      );
      return;
    }

    dispatch(setTraceFetchStatus({ id: trace.id, status: "loading" }));
    dispatch(clearTraceError({ id: trace.id }));

    try {
      await upsertChamberTrace(trace);
      dispatch(setTraceFetchStatus({ id: trace.id, status: "done" }));
      dispatch(clearTraceError({ id: trace.id }));
    } catch (error) {
      dispatch(setTraceFetchStatus({ id: trace.id, status: "error" }));
      dispatch(
        setTraceError({
          id: trace.id,
          error:
            error instanceof Error ? error.message : "Failed to sync trace",
        }),
      );
    }
  };
}
