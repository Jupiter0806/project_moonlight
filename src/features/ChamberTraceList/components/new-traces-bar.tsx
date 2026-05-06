"use client";

import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  runNewEntriesBarInstructions,
  selectNewReflectionsBar,
} from "@/store/slices/urtSlice";

export function NewTracesBar() {
  const newTracesBar = useAppSelector(selectNewReflectionsBar("chamberTraces"));

  const dispatch = useAppDispatch();
  const runInstruction = () => {
    dispatch(runNewEntriesBarInstructions({ timeline: "chamberTraces" }));
  };

  if (newTracesBar && newTracesBar.count === 0) return null;

  return (
    <div className="text-center" onClick={runInstruction}>
      {newTracesBar?.count} new traces available. Click to load.
    </div>
  );
}
