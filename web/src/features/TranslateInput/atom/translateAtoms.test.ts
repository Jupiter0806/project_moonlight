import { createStore } from "jotai";
import { describe, it, expect, beforeEach } from "vitest";
import {
  sourceLanguageAtom,
  targetLanguageAtom,
  sourceTextAtom,
  translationResultAtom,
} from "./translateAtoms";
import { LANGUAGES } from "@/lib/languages";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   - source language selection (atom)
//   - destination language selection (atom)
//   - translation input (atom)
//   - translation result (atom)

describe("translateAtoms", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  describe("sourceLanguageAtom", () => {
    it("defaults to the first language in the config", () => {
      expect(store.get(sourceLanguageAtom)).toBe(LANGUAGES[0].key);
    });

    it("can be updated to a new language key", () => {
      store.set(sourceLanguageAtom, LANGUAGES[1].key);
      expect(store.get(sourceLanguageAtom)).toBe(LANGUAGES[1].key);
    });
  });

  describe("targetLanguageAtom", () => {
    it("defaults to the second language in the config", () => {
      expect(store.get(targetLanguageAtom)).toBe(LANGUAGES[1].key);
    });

    it("can be updated to a new language key", () => {
      store.set(targetLanguageAtom, LANGUAGES[0].key);
      expect(store.get(targetLanguageAtom)).toBe(LANGUAGES[0].key);
    });
  });

  describe("sourceTextAtom", () => {
    it("defaults to an empty string", () => {
      expect(store.get(sourceTextAtom)).toBe("");
    });

    it("can be updated with input text", () => {
      store.set(sourceTextAtom, "Hello world");
      expect(store.get(sourceTextAtom)).toBe("Hello world");
    });
  });

  describe("translationResultAtom", () => {
    it("defaults to an empty string", () => {
      expect(store.get(translationResultAtom)).toBe("");
    });

    it("can be updated with a translation result", () => {
      store.set(translationResultAtom, "你好世界");
      expect(store.get(translationResultAtom)).toBe("你好世界");
    });
  });

  describe("atom independence", () => {
    it("source and target language atoms are independent", () => {
      store.set(sourceLanguageAtom, LANGUAGES[0].key);
      store.set(targetLanguageAtom, LANGUAGES[1].key);
      expect(store.get(sourceLanguageAtom)).toBe(LANGUAGES[0].key);
      expect(store.get(targetLanguageAtom)).toBe(LANGUAGES[1].key);
    });

    it("source text and translation result are independent", () => {
      store.set(sourceTextAtom, "Good morning");
      store.set(translationResultAtom, "早上好");
      expect(store.get(sourceTextAtom)).toBe("Good morning");
      expect(store.get(translationResultAtom)).toBe("早上好");
    });
  });
});
