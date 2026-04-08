"use client";

import { WithClassName } from "@/types/withClassName";
import { useCallback, useState, type Ref } from "react";

interface InputProps extends WithClassName {
  ref?: Ref<HTMLTextAreaElement>;
  name?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
}

export function Input({
  ref,
  name,
  placeholder,
  onChange,
  onKeyDown,
  value,
  defaultValue,
  disabled,
  className,
}: InputProps) {
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");

  const displayValue = value !== undefined ? value : internalValue;

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  const fireChange = useCallback((val: string) => onChange?.(val), [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    autoResize(e.target);
    fireChange(val);
  };

  return (
    <textarea
      ref={ref}
      name={name}
      rows={1}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={`w-full resize-none overflow-hidden border-none bg-transparent outline-none ${className}`}
    />
  );
}
