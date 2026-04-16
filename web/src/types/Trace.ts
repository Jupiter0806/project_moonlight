import { LanguageKey } from "@/lib/languages";

interface BaseTrace {
  id: string;
  created_at: number;
  q: string;
  // need to adapt translation and qa answer type differences
  a: string;
  user: string;
  reflection: string;
}

export interface QATrace extends BaseTrace {
  type: "qa";
  // to tell qa trace fetch answer
  // should only be used for traces created by AskInput;
  // otherwise, should be undefined
  answerRequired?: boolean;
}

export interface TranslationTrace extends BaseTrace {
  type: "translation";
  sourceLang: LanguageKey;
  targetLang: LanguageKey;
}

export type Trace = QATrace | TranslationTrace;
