export interface Language {
  key: string;
  name: string;
  inputPlaceholder?: string;
}

export const LANGUAGES = [
  { key: "en", name: "English", inputPlaceholder: "Enter Text" },
  { key: "zh-CN", name: "Chinese", inputPlaceholder: "输入文本" },
] as const satisfies Language[];

export type LanguageKey = (typeof LANGUAGES)[number]["key"];

export function getLanguageName(key: LanguageKey): string {
  return LANGUAGES.find((l) => l.key === key)!.name;
}
