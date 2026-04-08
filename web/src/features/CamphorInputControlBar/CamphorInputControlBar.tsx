import { Button } from "@/components/Button/Button";
import { atom, useAtom } from "jotai";

export const modelAtom = atom<"asking" | "translating">("translating");

export function CamphorInputControlBar() {
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
      {model === "asking" ? "Switch to Translating" : "Switch to Asking"}
    </Button>
  );
}
