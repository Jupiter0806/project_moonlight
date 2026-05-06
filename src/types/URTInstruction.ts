import { URTEntry } from "@/store/types";

export type URTInstruction = InstructionNewTraces;

export interface InstructionNewTraces {
  type: "add-entries";
  params: {
    entries: URTEntry[];
  };
}
