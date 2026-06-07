"use client";

import { WithClassName } from "@/types/withClassName";
import { clsx } from "clsx";
import { useCallback, useEffect, useRef, useState, type Ref } from "react";

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const displayValue = value !== undefined ? value : internalValue;

  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  };

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    if (!displayValue) {
      el.style.height = "auto";
    } else {
      autoResize(el);
    }
  }, [displayValue]);

  const fireChange = useCallback((val: string) => onChange?.(val), [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    fireChange(val);
  };

  return (
    <textarea
      ref={(el) => {
        (
          textareaRef as React.MutableRefObject<HTMLTextAreaElement | null>
        ).current = el;
        if (typeof ref === "function") ref(el);
        else if (ref)
          (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current =
            el;
      }}
      name={name}
      rows={1}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      disabled={disabled}
      className={clsx(
        "w-full resize-none overflow-hidden border-none bg-transparent outline-none",
        className,
      )}
    />
  );
}
