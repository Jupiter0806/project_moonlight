import { atom } from "jotai";

export const modelAtom = atom<"asking" | "translating">("translating");
