import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { QATrace } from "@/types/Trace";
import { fetchAnswer } from "@/lib/qa-service";
import { useAppDispatch } from "@/store/hooks";
import {
  upsertTraces,
  setTraceFetchStatus,
  setTraceError,
} from "@/store/slices/entitiesSlice";

export function useAnswer(trace?: QATrace) {
  const dispatch = useAppDispatch();

  const { data, error, status } = useQuery({
    queryKey: ["fetchAnswer", trace?.id],
    queryFn: () => fetchAnswer(trace!.q),
    enabled: trace?.answerRequired === true,
    staleTime: Infinity,
    retry: false,
  });

  useEffect(() => {
    if (!trace) return;

    console.log("Answer fetch status:", { status, traceId: trace?.id, error });
    if (status === "pending") {
      dispatch(setTraceFetchStatus({ id: trace.id, status: "loading" }));
      return;
    }

    if (status === "success") {
      dispatch(upsertTraces([{ ...trace, a: data, answerRequired: false }]));
      dispatch(setTraceFetchStatus({ id: trace.id, status: "done" }));
    } else if (status === "error") {
      console.error("Failed to fetch answer:", error);
      dispatch(setTraceFetchStatus({ id: trace.id, status: "error" }));
      dispatch(
        setTraceError({
          id: trace.id,
          error: error instanceof Error ? error.message : String(error),
        }),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);
}
