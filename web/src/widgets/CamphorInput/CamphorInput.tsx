import { useAtom } from "jotai";
import { CamphorInputControlBar } from "@/features/CamphorInputControlBar/CamphorInputControlBar";
import { modelAtom } from "@/features/CamphorInputControlBar/atom/camphorInputControlBarAtoms";
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

export function CamphorInput() {
  const [model] = useAtom(modelAtom);

  return (
    <div className="bg-surface flex flex-col gap-3 rounded-t-3xl p-6">
      {model === "asking" ? <AskInput /> : <TranslateInput />}
      <CamphorInputControlBar />
    </div>
  );
}
