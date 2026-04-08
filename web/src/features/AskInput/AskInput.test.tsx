import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { createStore, Provider } from "jotai";
import { AskInput } from "./AskInput";
import { askInputAtom } from "./atom/askInputAtoms";

// Mock the server action so tests don't hit real async logic
vi.mock("./actions", () => ({
  askAction: vi.fn(async (state: unknown) => state),
}));

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   1. Renders an Input component with placeholder "Ask Camphor"
//   2. User input is reflected in askInputAtom
//   3. Pressing Enter submits the form and calls the server action
//   4. Pressing Shift+Enter does NOT submit (allows newlines)
//   5. Input is disabled while the action is pending

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
    vi.clearAllMocks();
  });

  // Req 1: renders Input with placeholder "Ask Camphor"
  describe("placeholder", () => {
    it('renders with placeholder "Ask Camphor"', () => {
      renderWithStore(store);
      expect(screen.getByPlaceholderText("Ask Camphor")).toBeTruthy();
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
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.change(textarea, { target: { value: "What is gravity?" } });
      expect(store.get(askInputAtom)).toBe("What is gravity?");
    });

    it("reflects an externally set atom value in the input", () => {
      renderWithStore(store);
      act(() => {
        store.set(askInputAtom, "Pre-filled question");
      });
      expect(
        screen.getByPlaceholderText<HTMLTextAreaElement>("Ask Camphor").value,
      ).toBe("Pre-filled question");
    });

    it("clears the atom when the user clears the input", () => {
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask Camphor");
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
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.change(textarea, { target: { value: "Store A question" } });
      expect(storeA.get(askInputAtom)).toBe("Store A question");
      expect(storeB.get(askInputAtom)).toBe("");
    });
  });

  // Req 3: Enter submits the form
  describe("Enter key submission", () => {
    it("submits the form when Enter is pressed with text", async () => {
      const { askAction } = await import("./actions");
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.change(textarea, { target: { value: "What is light?" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      await waitFor(() => {
        expect(askAction).toHaveBeenCalled();
      });
    });

    it("clears the input after submission", async () => {
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.change(textarea, { target: { value: "My question" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      await waitFor(() => {
        expect(store.get(askInputAtom)).toBe("");
      });
    });

    it("does not submit when input is empty", async () => {
      const { askAction } = await import("./actions");
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: false });
      await waitFor(() => {
        expect(askAction).not.toHaveBeenCalled();
      });
    });
  });

  // Req 4: Shift+Enter does NOT submit
  describe("Shift+Enter", () => {
    it("does not submit when Shift+Enter is pressed", async () => {
      const { askAction } = await import("./actions");
      renderWithStore(store);
      const textarea = screen.getByPlaceholderText("Ask Camphor");
      fireEvent.change(textarea, { target: { value: "Multi-line" } });
      fireEvent.keyDown(textarea, { key: "Enter", shiftKey: true });
      await waitFor(() => {
        expect(askAction).not.toHaveBeenCalled();
      });
    });
  });
});
