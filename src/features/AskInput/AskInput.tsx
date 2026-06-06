"use client";

import { useActionState } from "react";
import { useAtom } from "jotai";
import { askInputAtom } from "./atom/askInputAtoms";
import { askAction, type AskActionState } from "./actions";
import { useFlushQa } from "./hooks/useFlushQa";
import { ChamberComposer } from "@/features/chamber-input/chamber-composer";

const initialState: AskActionState = {
  messages: [],
  error: null,
  lastAttempt: null,
};

export function AskInput() {
  const [value, setValue] = useAtom(askInputAtom);

  const [state, formAction, isPending] = useActionState<
    AskActionState,
    FormData
  >(askAction, initialState);

  const flushQa = useFlushQa();

  const handleSubmit = async () => {
    if (!value.trim()) return;

    const formData = new FormData();
    formData.set("question", value);

    // this action not doing anything
    await formAction(formData);
    flushQa();
    setValue("");
  };

  return (
    <ChamberComposer
      name="question"
      placeholder="Ask Camphor"
      value={value}
      onChange={setValue}
      onSubmit={handleSubmit}
      disabled={isPending}
      error={state.error}
    />
  );
}

export default AskInput;
