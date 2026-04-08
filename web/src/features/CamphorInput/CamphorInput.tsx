import { useAtom } from "jotai";
import {
  CamphorInputControlBar,
  modelAtom,
} from "../CamphorInputControlBar/CamphorInputControlBar";
import dynamic from "next/dynamic";

const TranslateInput = dynamic(
  () => import("../TranslateInput/TranslateInput"),
  {
    loading: () => <span>Translating...</span>,
  },
);

const AskInput = dynamic(() => import("../AskInput/AskInput"), {
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
