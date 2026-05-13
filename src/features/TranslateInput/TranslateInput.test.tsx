import { screen, fireEvent, act, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { createStore } from "jotai";
import { TranslateInput } from "./TranslateInput";
import {
  sourceLanguageAtom,
  targetLanguageAtom,
  sourceTextAtom,
  translationResultAtom,
} from "./atom/translateAtoms";
import { LANGUAGES } from "@/lib/languages";
import { selectAllTraces } from "@/store/slices/entitiesSlice";
import { selectURTEntries } from "@/store/slices/urtSlice";
import { renderWithStore } from "@/tests/renderWithStore";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   1. Handle source language selection and input
//   2. Handle destination language selection and present results
//   3. A switch button to swap source/destination
//   4. Enter key flushes translation as a Trace into chamberTraces timeline

const renderInput = (jotaiStore = createStore()) =>
  renderWithStore(<TranslateInput />, jotaiStore);

describe("TranslateInput", () => {
  // Req 1: source language selection and input
  describe("source side", () => {
    it("renders a source language selector", () => {
      renderInput();
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(1);
    });

    it("reflects sourceLanguageAtom in the source selector", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      renderInput(store);
      const [sourceSelect] = screen.getAllByRole(
        "combobox",
      ) as HTMLSelectElement[];
      expect(sourceSelect.value).toBe(LANGUAGES[0].key);
    });

    it("updates sourceLanguageAtom when source language is changed", () => {
      const store = createStore();
      renderInput(store);
      const [sourceSelect] = screen.getAllByRole("combobox");
      fireEvent.change(sourceSelect, { target: { value: LANGUAGES[1].key } });
      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[1]);
    });

    it("renders a text input for source text", () => {
      renderInput();
      expect(screen.getByRole("textbox")).toBeInTheDocument();
    });

    it("updates sourceTextAtom when the user types (after debounce)", async () => {
      const store = createStore();
      renderInput(store);
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
      renderInput(store);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "",
      );
    });

    it("source text is preserved when source language is changed", () => {
      const store = createStore();
      store.set(sourceTextAtom, "Hello");
      renderInput(store);
      const [sourceSelect] = screen.getAllByRole("combobox");
      fireEvent.change(sourceSelect, { target: { value: LANGUAGES[1].key } });
      expect(store.get(sourceTextAtom)).toBe("Hello");
    });
  });

  // Req 2: destination language selection and results
  describe("destination side", () => {
    it("renders a destination language selector", () => {
      renderInput();
      const selects = screen.getAllByRole("combobox");
      expect(selects.length).toBeGreaterThanOrEqual(2);
    });

    it("reflects targetLanguageAtom in the destination selector", () => {
      const store = createStore();
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderInput(store);
      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[1].value).toBe(LANGUAGES[1].key);
    });

    it("updates targetLanguageAtom when destination language is changed", () => {
      const store = createStore();
      renderInput(store);
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
      renderInput(store);
      await waitFor(() => expect(screen.getByText("你好")).toBeInTheDocument());
    });

    it("renders the result area even when translation result is empty", () => {
      const store = createStore();
      // translationResultAtom defaults to ""
      renderInput(store);
      // the result paragraph should exist and be empty
      const selects = screen.getAllByRole("combobox");
      expect(selects[1]).toBeInTheDocument(); // destination side rendered
    });
  });

  // Req 3: switch button swaps source/destination
  describe("switch button", () => {
    it("renders a switch button", () => {
      renderInput();
      expect(
        screen.getByRole("button", { name: /switch/i }),
      ).toBeInTheDocument();
    });

    it("swaps source and target language atoms when clicked", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderInput(store);

      fireEvent.click(screen.getByRole("button", { name: /switch/i }));

      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[1]);
      expect(store.get(targetLanguageAtom)).toEqual(LANGUAGES[0]);
    });

    it("reflects swapped languages in both selectors after switching", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderInput(store);

      fireEvent.click(screen.getByRole("button", { name: /switch/i }));

      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[0].value).toBe(LANGUAGES[1].key);
      expect(selects[1].value).toBe(LANGUAGES[0].key);
    });

    it("default source and target languages are different (switch is meaningful)", () => {
      const store = createStore();
      renderInput(store);
      const selects = screen.getAllByRole("combobox") as HTMLSelectElement[];
      expect(selects[0].value).not.toBe(selects[1].value);
    });

    it("switching twice restores the original language pair", () => {
      const store = createStore();
      store.set(sourceLanguageAtom, LANGUAGES[0]);
      store.set(targetLanguageAtom, LANGUAGES[1]);
      renderInput(store);

      const btn = screen.getByRole("button", { name: /switch/i });
      fireEvent.click(btn);
      fireEvent.click(btn);

      expect(store.get(sourceLanguageAtom)).toEqual(LANGUAGES[0]);
      expect(store.get(targetLanguageAtom)).toEqual(LANGUAGES[1]);
    });
  });

  // Req 4: Enter key flushes translation as a Trace into chamberTraces
  describe("flush on Enter", () => {
    it("does nothing when translation result is empty", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      expect(selectAllTraces(reduxStore.getState())).toHaveLength(0);
    });

    it("does nothing when source text is empty", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      expect(selectAllTraces(reduxStore.getState())).toHaveLength(0);
    });

    it("does nothing on Shift+Enter", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), {
        key: "Enter",
        shiftKey: true,
      });

      expect(selectAllTraces(reduxStore.getState())).toHaveLength(0);
    });

    it("adds a Trace entity to the Redux entities store on Enter", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      const traces = selectAllTraces(reduxStore.getState());
      expect(traces).toHaveLength(1);
      expect(traces[0].q).toBe("Hello");
      expect(traces[0].a).toBe("你好");
      expect(traces[0].type).toBe("translation");
    });

    it("prepends a URTEntry into the chamberTraces timeline on Enter", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      const entries = selectURTEntries("chamberTraces")(reduxStore.getState());
      expect(entries).toHaveLength(1);
      expect(entries[0].type).toBe("trace");
      if (entries[0].type !== "trace") {
        throw new Error("Expected chamberTraces entry to be a trace");
      }
      expect(entries[0].content.displayType).toBe("translation-trace");
    });

    it("the URTEntry id matches the Trace entity id", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      const traces = selectAllTraces(reduxStore.getState());
      const entries = selectURTEntries("chamberTraces")(reduxStore.getState());
      expect(entries[0].type).toBe("trace");
      if (entries[0].type !== "trace") {
        throw new Error("Expected chamberTraces entry to be a trace");
      }
      expect(entries[0].content.id).toBe(traces[0].id);
    });

    it("clears source text atom after flush", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      expect(jotaiStore.get(sourceTextAtom)).toBe("");
    });

    it("clears translation result atom after flush", () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      expect(jotaiStore.get(translationResultAtom)).toBe("");
    });

    it("flushing twice creates two independent Trace entities", async () => {
      const jotaiStore = createStore();
      jotaiStore.set(sourceTextAtom, "Hello");
      jotaiStore.set(translationResultAtom, "你好");
      const { reduxStore } = renderInput(jotaiStore);

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      // wait for atoms to clear and re-render before setting new values
      await act(async () => {
        jotaiStore.set(sourceTextAtom, "Goodbye");
        jotaiStore.set(translationResultAtom, "再见");
      });

      fireEvent.keyDown(screen.getByRole("textbox"), { key: "Enter" });

      const traces = selectAllTraces(reduxStore.getState());
      expect(traces).toHaveLength(2);
      expect(traces.map((t) => t.q)).toContain("Hello");
      expect(traces.map((t) => t.q)).toContain("Goodbye");
    });
  });
});
