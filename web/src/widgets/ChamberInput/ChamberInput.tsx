"use client";

import { useAtom } from "jotai";
import { ChamberInputControlBar } from "@/features/ChamberInputControlBar/ChamberInputControlBar";
import { modelAtom } from "@/features/ChamberInputControlBar/atom/chamberInputControlBarAtoms";
import dynamic from "next/dynamic";

const TranslateInput = dynamic(
  () => import("@/features/TranslateInput/TranslateInput"),
  {
    loading: () => <span>Translating...</span>,
  },
);

const AskInput = dynamic(() => import("@/features/AskInput/AskInput"), {
  loading: () => <span>Loading...</span>,
});

export function ChamberInput() {
  const [model] = useAtom(modelAtom);

  return (
    <div className="bg-card flex flex-col gap-3 rounded-3xl p-6">
      {model === "asking" ? <AskInput /> : <TranslateInput />}
      <ChamberInputControlBar />
    </div>
  );
}
