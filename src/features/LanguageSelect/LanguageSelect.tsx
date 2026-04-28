"use client";

import { LANGUAGES, type Language } from "@/lib/languages";
import { WithClassName } from "@/types/withClassName";

interface LanguageSelectProps extends WithClassName {
  value?: Language;
  defaultValue?: Language;
  onChange?: (lang: Language) => void;
}

export function LanguageSelect({
  value,
  defaultValue,
  onChange,
  className,
}: LanguageSelectProps) {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const lang = LANGUAGES.find((l) => l.key === e.target.value);
    if (lang) onChange?.(lang);
  };

  return (
    <select
      value={value?.key}
      defaultValue={defaultValue?.key}
      onChange={handleChange}
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
