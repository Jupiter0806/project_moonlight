"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  runNewEntriesBarInstructions,
  selectNewReflectionsBar,
} from "@/store/slices/urtSlice";

export function NewTracesBar() {
  const newTracesBar = useAppSelector(selectNewReflectionsBar("chamberTraces"));
  const count = newTracesBar?.count ?? 0;

  const dispatch = useAppDispatch();
  const runInstruction = () => {
    dispatch(runNewEntriesBarInstructions({ timeline: "chamberTraces" }));
  };

  if (count <= 0) return null;

  return (
    <div className="text-center" onClick={runInstruction}>
      {count} new traces available. Click to load.
    </div>
  );
}
