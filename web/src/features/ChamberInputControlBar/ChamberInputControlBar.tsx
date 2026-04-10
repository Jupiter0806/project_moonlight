"use client";

import { Button } from "@/components/Button/Button";
import { useAtom } from "jotai";
import { RiTranslateAi } from "react-icons/ri";
import { RiTreeFill } from "react-icons/ri";
import { modelAtom } from "./atom/chamberInputControlBarAtoms";

export function ChamberInputControlBar() {
  return (
    <div className="flex gap-2">
      <ModelToggle />
    </div>
  );
}

function ModelToggle() {
  const [model, setModel] = useAtom(modelAtom);
  return (
    <Button
      onClick={() => setModel(model === "asking" ? "translating" : "asking")}
    >
      {model === "asking" ? <RiTranslateAi /> : <RiTreeFill />}
    </Button>
  );
}
