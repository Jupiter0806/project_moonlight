"use client";

import { useAtom } from "jotai";
import { ChamberComposer } from "@/features/chamber-input/chamber-composer";
import { marginaliaInputAtom } from "./atom/marginalia-input-atoms";

export function MarginaliaInput() {
  const [value, setValue] = useAtom(marginaliaInputAtom);

  const handleSubmit = async () => {
    if (!value.trim()) return;

    // Marginalia trace sync will be wired in the next step.
    setValue("");
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
