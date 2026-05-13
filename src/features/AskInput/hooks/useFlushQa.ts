import { useAtom } from "jotai";
import { askInputAtom } from "../atom/askInputAtoms";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  selectActiveUserId,
  selectIsLoggedIn,
} from "@/store/slices/sessionSlice";
import {
  upsertTraces,
  setTraceFetchStatus,
  clearTraceError,
  setTraceError,
} from "@/store/slices/entitiesSlice";
import { appendEntries } from "@/store/slices/urtSlice";
import { QATrace } from "@/types/Trace";
import {
  streamQaTraceAnswer,
  upsertChamberTrace,
} from "@/lib/chamberTraceService";

export function useFlushQa() {
  const [value, setValue] = useAtom(askInputAtom);

  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectActiveUserId);
  const isLoggedIn = useAppSelector(selectIsLoggedIn);

  return () => {
    if (!value.trim()) return;

    const id = crypto.randomUUID();

    const trace: QATrace = {
      id,
      createdAt: Date.now(),
      q: value,
      a: "",
      user: userId,
      reflection: "",
      type: "qa",
    };

    dispatch(upsertTraces([trace]));

    dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [
          {
            type: "trace",
            entryId: `entry-${id}`,
            content: { id, displayType: "qa-trace" },
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

      void (async () => {
        try {
          const res = await upsertChamberTrace(trace);

          if (res.answer) {
            dispatch(upsertTraces([{ ...trace, a: res.answer }]));
          } else {
            let streamedAnswer = "";
            await streamQaTraceAnswer(id, (delta) => {
              streamedAnswer += delta;
              dispatch(upsertTraces([{ ...trace, a: streamedAnswer }]));
            });
          }

          dispatch(setTraceFetchStatus({ id, status: "done" }));
          dispatch(clearTraceError({ id }));
        } catch (error) {
          dispatch(setTraceFetchStatus({ id, status: "error" }));
          dispatch(
            setTraceError({
              id,
              error:
                error instanceof Error ? error.message : "Failed to sync trace",
            }),
          );
        }
      })();
    }

    setValue("");
  };
}
