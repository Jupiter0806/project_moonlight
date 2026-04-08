import { atom } from "jotai";
import { LANGUAGES, type Language } from "@/lib/languages";

export const sourceLanguageAtom = atom<Language>(LANGUAGES[0]);
export const targetLanguageAtom = atom<Language>(LANGUAGES[1]);

export const sourceTextAtom = atom<string>("");
export const translationResultAtom = atom<string>("");
