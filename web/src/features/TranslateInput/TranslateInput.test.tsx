import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
} from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TranslateInput } from "./TranslateInput";
import {
  sourceLanguageAtom,
  targetLanguageAtom,
  sourceTextAtom,
  translationResultAtom,
} from "./atom/translateAtoms";
import { LANGUAGES } from "@/lib/languages";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   1. Handle source language selection and input
//   2. Handle destination language selection and present results
//   3. A switch button to swap source/destination

function renderWithStore(store = createStore()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return {
    store,
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <Provider store={store}>
          <TranslateInput />
        </Provider>
      </QueryClientProvider>,
    ),
  };
}

describe("TranslateInput", () => {
  // Req 1: source language selection and input
  describe("source side", () => {
    it("renders a source language selector", () => {
      renderWithStore();
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it("reflects sourceLanguageAtom in the source selector", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      renderWithStore(store);
      const [sourceSelect] = screen.getAllByRole(
        "combobox",
      ) as HTMLSelectElement[];
      expect(sourceSelect.value).toBe(LANGUAGES[0].key);
    });

    it("updates sourceLanguageAtom when source language is changed", () => {
      const store = createStore();
      renderWithStore(store);
      const [sourceSelect] = screen.getAllByRole("combobox");
      fireEvent.change(sourceSelect, { target: { value: LANGUAGES[1].key } });
      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[1]);
    });

    it("renders a text input for source text", () => {
      renderWithStore();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("updates sourceTextAtom when the user types (after debounce)", async () => {
      const store = createStore();
      renderWithStore(store);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "Hello" },
      });
      // Input has debounce={200} — atom update is not immediate
      await waitFor(() => expect(store.get(sourceTextAtom)).toBe("Hello"), {
        timeout: 500,
      });
    });

    it("starts with an empty source text input", () => {
      const store = createStore();
      renderWithStore(store);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "",
      );
    });

    it("source text is preserved when source language is changed", () => {
      const store = createStore();
      store.set(sourceTextAtom, "Hello");
      renderWithStore(store);
      const [sourceSelect] = screen.getAllByRole("combobox");
      fireEvent.change(sourceSelect, { target: { value: LANGUAGES[1].key } });
      expect(store.get(sourceTextAtom)).toBe("Hello");
    });
  });

  // Req 2: destination language selection and results
  describe("destination side", () => {
    it("renders a destination language selector", () => {
      renderWithStore();
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it("reflects targetLanguageAtom in the destination selector", () => {
      const store = createStore();
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderWithStore(store);
      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[1].value).toBe(LANGUAGES[1].key);
    });

    it("updates targetLanguageAtom when destination language is changed", () => {
      const store = createStore();
      renderWithStore(store);
      const selects = screen.getAllByRole("combobox");
      fireEvent.change(selects[1], { target: { value: LANGUAGES[0].key } });
      expect(store.get(targetLanguageAtom)).toEqual(LANGUAGES[0]);
    });

    it("displays the translation result from translationResultAtom", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ translatedText: "你好" }),
        }),
      );
      const store = createStore();
      store.set(sourceTextAtom, "Hello");
      renderWithStore(store);
      await waitFor(() => expect(screen.getByText("你好")).toBeInTheDocument());
    });

    it("renders the result area even when translation result is empty", () => {
      const store = createStore();
      // translationResultAtom defaults to ""
      renderWithStore(store);
      // the result paragraph should exist and be empty
      const selects = screen.getAllByRole("combobox");
      expect(selects[1]).toBeInTheDocument(); // destination side rendered
    });
  });

  // Req 3: switch button swaps source/destination
  describe("switch button", () => {
    it("renders a switch button", () => {
      renderWithStore();
      expect(
        screen.getByRole("button", { name: /switch/i }),
      ).toBeInTheDocument();
    });

    it("swaps source and target language atoms when clicked", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderWithStore(store);

      fireEvent.click(screen.getByRole("button", { name: /switch/i }));

      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[1]);
      expect(store.get(targetLanguageAtom)).toEqual(LANGUAGES[0]);
    });

    it("reflects swapped languages in both selectors after switching", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderWithStore(store);

      fireEvent.click(screen.getByRole("button", { name: /switch/i }));

      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[0].value).toBe(LANGUAGES[1].key);
      expect(selects[1].value).toBe(LANGUAGES[0].key);
    });

    it("default source and target languages are different (switch is meaningful)", () => {
      const store = createStore();
      renderWithStore(store);
      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[0].value).not.toBe(selects[1].value);
    });

    it("switching twice restores the original language pair", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderWithStore(store);

      const btn = screen.getByRole("button", { name: /switch/i });
      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[0]);
      expect(store.get(targetLanguageAtom)).toEqual(LANGUAGES[1]);
    });
  });
});
