import { createStore } from "jotai";
import { describe, it, expect, beforeEach } from "vitest";
import { askInputAtom } from "./askInputAtoms";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   - a Jotai atom that holds the user's ask input text

describe("askInputAtom", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  it("defaults to an empty string", () => {
    expect(store.get(askInputAtom)).toBe("");
  });

  it("can be updated to a new value", () => {
    store.set(askInputAtom, "What is photosynthesis?");
    expect(store.get(askInputAtom)).toBe("What is photosynthesis?");
  });

  it("can be cleared back to empty string", () => {
    store.set(askInputAtom, "Some question");
    store.set(askInputAtom, "");
    expect(store.get(askInputAtom)).toBe("");
  });

  it("each store instance is independent", () => {
    const storeA = createStore();
    const storeB = createStore();
    storeA.set(askInputAtom, "question A");
    expect(storeB.get(askInputAtom)).toBe("");
  });
});
