"use client";

import { useAtom } from "jotai";
import { ChamberComposer } from "@/features/chamber-input/chamber-composer";
import { marginaliaInputAtom } from "./atom/marginalia-input-atoms";
import { useFlushMarginalia } from "./hooks/use-flush-marginalia";

export function MarginaliaInput() {
  const [value, setValue] = useAtom(marginaliaInputAtom);
  const flushMarginalia = useFlushMarginalia();

  const handleSubmit = async () => {
    if (!value.trim()) return;

    flushMarginalia();
  };

  return (
    <ChamberComposer
      name="marginalia"
      placeholder="Write marginalia"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
    />
  );
}

export default MarginaliaInput;
