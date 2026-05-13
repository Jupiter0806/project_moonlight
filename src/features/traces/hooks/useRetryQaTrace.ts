import { streamQaTraceAnswer } from "@/lib/chamberTraceService";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  clearTraceError,
  setTraceError,
  setTraceFetchStatus,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import { selectIsLoggedIn } from "@/store/slices/sessionSlice";
import { QATrace } from "@/types/Trace";

export function useRetryQaTrace(trace: QATrace | undefined): () => void {
  const dispatch = useAppDispatch();
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return async () => {
    if (!trace) return;

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
    const traceForRetry: QATrace = {
      ...trace,
      a: "",
      qaAnswerStatus: "pending",
    };
    dispatch(upsertTraces([traceForRetry]));

    try {
      let streamedAnswer = "";
      await streamQaTraceAnswer(trace.id, (delta) => {
        streamedAnswer += delta;
        dispatch(upsertTraces([{ ...traceForRetry, a: streamedAnswer }]));
      });

      dispatch(
        upsertTraces([
          {
            ...traceForRetry,
            a: streamedAnswer,
            qaAnswerStatus: "completed",
          },
        ]),
      );

      dispatch(setTraceFetchStatus({ id: trace.id, status: "done" }));
      dispatch(clearTraceError({ id: trace.id }));
    } catch (error) {
      dispatch(upsertTraces([{ ...traceForRetry, qaAnswerStatus: "failed" }]));
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
