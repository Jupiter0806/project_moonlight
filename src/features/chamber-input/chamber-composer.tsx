"use client";

import { useRef } from "react";
import { Input } from "@/components/Input/Input";
import { MobileSubmitButton } from "@/components/MobileSubmitButton/MobileSubmitButton";
import { Button } from "@/components/Button/Button";
import { MdArrowUpward } from "react-icons/md";

interface ChamberComposerProps {
  name: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void | Promise<void>;
  disabled?: boolean;
  error?: string | null;
}

export function ChamberComposer({
  name,
  placeholder,
  value,
  onChange,
  onSubmit,
  disabled,
  error,
}: ChamberComposerProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = async () => {
    if (!value.trim() || disabled) return;
    await onSubmit();
    formRef.current?.reset();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      formRef.current?.requestSubmit();
    }
  };

  const submitDisabled = disabled || !value.trim();

  return (
    <form ref={formRef} action={handleSubmit}>
      <Input
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={handleKeyDown}
        disabled={disabled}
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-muted-foreground hidden text-xs md:block">
          Press Cmd/Ctrl+Enter to submit
        </p>

        <Button
          aria-label="Submit"
          className="hidden h-9! bg-blue-500 px-2! hover:bg-blue-600 md:flex"
          disabled={submitDisabled}
          onClick={() => formRef.current?.requestSubmit()}
        >
          <MdArrowUpward className="text-xl" />
        </Button>

        <MobileSubmitButton
          className="float-right"
          disabled={submitDisabled}
          onClick={() => formRef.current?.requestSubmit()}
        />
      </div>
    </form>
  );
}
