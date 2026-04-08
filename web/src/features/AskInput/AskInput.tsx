"use client";

import { Input } from "@/components/Input/Input";
import { useAtom } from "jotai";
import { askInputAtom } from "./atom/askInputAtoms";

export function AskInput() {
  const [value, setValue] = useAtom(askInputAtom);

  return <Input placeholder="Ask" value={value} onChange={setValue} />;
}
