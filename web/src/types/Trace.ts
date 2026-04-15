import { LanguageKey } from "@/lib/languages";

interface BaseTrace {
  id: string;
  created_at: number;
  q: string;
  a: string;
  user: string;
  reflection: string;
}

export interface QATrace extends BaseTrace {
  type: "qa";
}

export interface TranslationTrace extends BaseTrace {
  type: "translation";
  sourceLang: LanguageKey;
  targetLang: LanguageKey;
}

export type Trace = QATrace | TranslationTrace;
