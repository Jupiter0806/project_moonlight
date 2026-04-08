"use client";

import { useActionState, useRef } from "react";
import { Input } from "@/components/Input/Input";
import { useAtom } from "jotai";
import { askInputAtom } from "./atom/askInputAtoms";
import { askAction, type AskActionState } from "./actions";

const initialState: AskActionState = {
  messages: [],
  error: null,
  lastAttempt: null,
};

export function AskInput() {
  const [value, setValue] = useAtom(askInputAtom);
  const formRef = useRef<HTMLFormElement>(null);

  const [state, formAction, isPending] = useActionState<
    AskActionState,
    FormData
  >(askAction, initialState);

  const handleSubmit = async (formData: FormData) => {
    if (!value.trim()) return;
    await formAction(formData);
    setValue("");
    formRef.current?.reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  return (
    <form ref={formRef} action={handleSubmit}>
      <Input
        name="question"
        placeholder="Ask Camphor"
        value={value}
        onChange={setValue}
        onKeyDown={handleKeyDown}
        disabled={isPending}
      />
      {state.error && <p className="text-sm text-red-500">{state.error}</p>}
    </form>
  );
}

export default AskInput;
