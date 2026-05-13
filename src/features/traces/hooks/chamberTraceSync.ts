import { AppDispatch } from "@/store/store";
import {
  clearTraceError,
  setTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import { setTimelineCursor } from "@/store/slices/urtSlice";

export function applyChamberTraceSyncSuccess(
  dispatch: AppDispatch,
  traceId: string,
  cursor: string,
) {
  dispatch(setTraceFetchStatus({ id: traceId, status: "done" }));
  dispatch(clearTraceError({ id: traceId }));
  dispatch(
    setTimelineCursor({
      timeline: "chamberTraces",
      position: "bottom",
      cursor,
    }),
  );
}
