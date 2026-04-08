import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";
import { createStore, Provider } from "jotai";
import { AskInput } from "./AskInput";
import { askInputAtom } from "./atom/askInputAtoms";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   1. Renders an Input component with placeholder "Ask"
//   2. User input is reflected in askInputAtom

function renderWithStore(store = createStore()) {
  return {
    store,
    ...render(
      <Provider store={store}>
        <AskInput />
      </Provider>,
    ),
  };
}

describe("AskInput", () => {
  let store: ReturnType<typeof createStore>;

  beforeEach(() => {
    store = createStore();
  });

  // Req 1: renders Input with placeholder "Ask"
  describe("placeholder", () => {
    it('renders with placeholder "Ask"', () => {
      renderWithStore(store);
      expect(screen.getByPlaceholderText("Ask")).toBeTruthy();
    });
  });

  // Req 2: user input is reflected in atom
  describe("askInputAtom", () => {
    it("atom starts empty", () => {
      renderWithStore(store);
      expect(store.get(askInputAtom)).toBe("");
    });

    it("updates the atom when the user types", () => {
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask");
      fireEvent.change(textarea, { target: { value: "What is gravity?" } });
      expect(store.get(askInputAtom)).toBe("What is gravity?");
    });

    it("reflects an externally set atom value in the input", () => {
      renderWithStore(store);
      act(() => {
        store.set(askInputAtom, "Pre-filled question");
      });
      expect(
        screen.getByPlaceholderText<HTMLTextAreaElement>("Ask").value,
      ).toBe("Pre-filled question");
    });

    it("clears the atom when the user clears the input", () => {
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask");
      fireEvent.change(textarea, { target: { value: "Something" } });
      fireEvent.change(textarea, { target: { value: "" } });
      expect(store.get(askInputAtom)).toBe("");
    });

    it("each store instance is independent", () => {
      const storeA = createStore();
      const storeB = createStore();
      render(
        <Provider store={storeA}>
          <AskInput />
        </Provider>,
      );
      const textarea = screen.getByPlaceholderText("Ask");
      fireEvent.change(textarea, { target: { value: "Store A question" } });
      expect(storeA.get(askInputAtom)).toBe("Store A question");
      expect(storeB.get(askInputAtom)).toBe("");
    });
  });
});
