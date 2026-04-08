import { useAtom } from "jotai";
import {
  CamphorInputControlBar,
  modelAtom,
} from "../CamphorInputControlBar/CamphorInputControlBar";
import { TranslateInput } from "../TranslateInput/TranslateInput";
import { AskInput } from "../AskInput/AskInput";

export function CamphorInput() {
  const [model] = useAtom(modelAtom);

  return (
    <div className="bg-surface flex flex-col gap-3 rounded-t-3xl p-6">
      {model === "asking" ? <AskInput /> : <TranslateInput />}
      <CamphorInputControlBar />
    </div>
  );
}
