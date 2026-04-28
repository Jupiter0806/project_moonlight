"use client";

import { useAtom, useAtomValue } from "jotai";
import { currentChamberInputAtom } from "@/atoms/chamber-input-atoms";
import dynamic from "next/dynamic";

const TranslateInput = dynamic(
  () => import("@/features/TranslateInput/TranslateInput"),
  {
    loading: () => <span>Loading...</span>,
  },
);

const AskInput = dynamic(() => import("@/features/AskInput/AskInput"), {
  loading: () => <span>Loading...</span>,
});

export function ChamberInput() {
  const currInput = useAtomValue(currentChamberInputAtom);

  return (
    <div className="bg-card flex flex-col gap-3 rounded-3xl p-6">
      {currInput === "asking" ? <AskInput /> : <TranslateInput />}
    </div>
  );
}
