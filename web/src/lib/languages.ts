export interface Language {
  key: string;
  name: string;
}

export const LANGUAGES = [
  { key: "en", name: "English" },
  { key: "zh-CN", name: "Chinese" },
] as const satisfies Language[];

export type LanguageKey = (typeof LANGUAGES)[number]["key"];
