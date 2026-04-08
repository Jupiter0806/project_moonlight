"use client";

import { WithClassName } from "@/types/withClassName";
import { useCallback, useEffect, useRef, useState } from "react";

interface InputProps extends WithClassName {
  placeholder?: string;
  onChange?: (value: string) => void;
  debounce?: number;
  value?: string;
  defaultValue?: string;
}

export function Input({
  placeholder,
  onChange,
  debounce: debounceDelay,
  value,
  defaultValue,
  className,
}: InputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [internalValue, setInternalValue] = useState(defaultValue ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const displayValue = value !== undefined ? value : internalValue;

  const autoResize = () => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  };

  const fireChange = useCallback((val: string) => onChange?.(val), [onChange]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setInternalValue(val);
    autoResize();

    if (debounceDelay && debounceDelay > 0) {
      if (timerRef.current) clearTimeout(timerRef.current);
      console.debug("Setting debounce timer with delay", debounceDelay);
      timerRef.current = setTimeout(() => fireChange(val), debounceDelay);
    } else {
      fireChange(val);
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <textarea
      ref={textareaRef}
      rows={1}
      placeholder={placeholder}
      value={displayValue}
      onChange={handleChange}
      className={`w-full resize-none overflow-hidden border-none bg-transparent outline-none ${className}`}
    />
  );
}
