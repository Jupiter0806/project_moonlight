"use client";

import { LANGUAGES } from "@/lib/languages";
import { WithClassName } from "@/types/withClassName";

interface LanguageSelectProps extends WithClassName {
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
}

export function LanguageSelect({
  value,
  defaultValue,
  onChange,
  className,
}: LanguageSelectProps) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
      className={className}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
