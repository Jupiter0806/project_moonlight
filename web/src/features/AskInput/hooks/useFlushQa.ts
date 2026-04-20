import { useAtom } from "jotai";
import { askInputAtom } from "../atom/askInputAtoms";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { selectActiveUserId } from "@/store/slices/sessionSlice";
import {
  upsertTraces,
  setTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import { prependEntries } from "@/store/slices/urtSlice";

export function useFlushQa() {
  const [value, setValue] = useAtom(askInputAtom);

  const dispatch = useAppDispatch();
  const userId = useAppSelector(selectActiveUserId);

  return () => {
    if (!value.trim()) return;

    const id = crypto.randomUUID();

    dispatch(
      upsertTraces([
        {
          id,
          createdAt: Date.now(),
          q: value,
          a: "",
          answerRequired: true,
          user: userId,
          reflection: "",
          type: "qa",
        },
      ]),
    );

    dispatch(setTraceFetchStatus({ id, status: "none" }));

    dispatch(
      prependEntries({
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

    setValue("");
  };
}
