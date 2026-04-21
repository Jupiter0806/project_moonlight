import { atom } from "jotai";

export const currentChamberInputAtom = atom<"asking" | "translating">(
  "translating",
);
