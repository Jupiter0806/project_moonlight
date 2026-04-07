"use client";

import { LANGUAGES } from "@/lib/languages";

interface LanguageSelectProps {
  value?: string;
  defaultValue?: string;
  onChange?: (key: string) => void;
}

export function LanguageSelect({
  value,
  defaultValue,
  onChange,
}: LanguageSelectProps) {
  return (
    <select
      value={value}
      defaultValue={defaultValue}
      onChange={(e) => onChange?.(e.target.value)}
    >
      {LANGUAGES.map((lang) => (
        <option key={lang.key} value={lang.key}>
          {lang.name}
        </option>
      ))}
    </select>
  );
}
