import { LanguageKey } from "@/lib/languages";

interface BaseTrace {
  id: string;
  createdAt: number;
  q: string;
  // need to adapt translation and qa answer type differences
  a: string;
  user: string;
  reflection: string;
}

export type QAAnswerStatus = "pending" | "completed" | "failed";

export interface QATrace extends BaseTrace {
  type: "qa";
  qaAnswerStatus?: QAAnswerStatus;
}

export interface TranslationTrace extends BaseTrace {
  type: "translation";
  sourceLang: LanguageKey;
  targetLang: LanguageKey;
}

export type Trace = QATrace | TranslationTrace;
