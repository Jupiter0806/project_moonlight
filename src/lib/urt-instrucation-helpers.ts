import { URTEntry } from "@/store/types";
import { InstructionNewTraces, URTInstruction } from "@/types/URTInstruction";

export function buildInstruction(
  type: "add-entries",
  params: Record<string, unknown>,
): URTInstruction {
  return buildInstructionAddEntries(params.entries as URTEntry[]);
}

function buildInstructionAddEntries(entries: URTEntry[]): InstructionNewTraces {
  return {
    type: "add-entries",
    params: {
      entries,
    },
  };
}
