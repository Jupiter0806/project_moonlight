import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { LanguageSelect } from "./LanguageSelect";
import { LANGUAGES } from "@/lib/languages";

// --- Tests are written against the stated requirements, not the implementation ---

describe("LanguageSelect", () => {
  // Req 1: access a common available language config for language name and key
  describe("language config", () => {
    it("renders an option for every language in the shared config", () => {
      render(<LanguageSelect />);
      LANGUAGES.forEach((lang) => {
        expect(
          screen.getByRole("option", { name: lang.name }),
        ).toBeInTheDocument();
      });
    });

    it("each option value matches the language key from the config", () => {
      render(<LanguageSelect />);
      LANGUAGES.forEach((lang) => {
        const option = screen.getByRole("option", {
          name: lang.name,
        }) as HTMLOptionElement;
        expect(option.value).toBe(lang.key);
      });
    });
  });

  // Req 2: a select to select a language
  describe("select behaviour", () => {
    it("renders a select element", () => {
      render(<LanguageSelect />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("calls onChange with the language key when selection changes", () => {
      const onChange = vi.fn();
      render(<LanguageSelect onChange={onChange} />);

      const secondLang = LANGUAGES[1];
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: secondLang.key },
      });

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith(secondLang.key);
    });

    it("reflects the controlled value", () => {
      const firstLang = LANGUAGES[0];
      render(<LanguageSelect value={firstLang.key} onChange={vi.fn()} />);
      const select = screen.getByRole("combobox") as HTMLSelectElement;
      expect(select.value).toBe(firstLang.key);
    });

    it("does not call onChange when no handler is provided", () => {
      render(<LanguageSelect />);
      expect(() =>
        fireEvent.change(screen.getByRole("combobox"), {
          target: { value: LANGUAGES[0].key },
        }),
      ).not.toThrow();
    });
  });
});
