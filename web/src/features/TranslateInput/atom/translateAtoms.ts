import { atom } from "jotai";
import { LANGUAGES } from "@/lib/languages";

export const sourceLanguageAtom = atom<string>(LANGUAGES[0].key);
export const targetLanguageAtom = atom<string>(LANGUAGES[1].key);

export const sourceTextAtom = atom<string>("");
export const translationResultAtom = atom<string>("");
