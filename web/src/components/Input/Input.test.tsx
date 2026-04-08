import { render, screen, fireEvent, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Input } from "./Input";

// --- Tests are written against the stated requirements, not the implementation ---

describe("Input", () => {
  // Req 2: accept placeholder as props
  describe("placeholder prop", () => {
    it("renders the placeholder when provided", () => {
      render(<Input placeholder="Type here..." />);
      expect(screen.getByPlaceholderText("Type here...")).toBeInTheDocument();
    });

    it("renders without placeholder when not provided", () => {
      render(<Input />);
      const textarea = screen.getByRole("textbox");
      expect(textarea).not.toHaveAttribute("placeholder");
    });
  });

  // Req 1 & 3: no border, transparent bg
  describe("visual styles", () => {
    it("has no border", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveClass("border-none");
    });

    it("has transparent background", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveClass("bg-transparent");
    });
  });

  // Req 5: should be textarea, initially 1 row
  describe("textarea element", () => {
    it("renders as a textarea element", () => {
      render(<Input />);
      expect(screen.getByRole("textbox").tagName.toLowerCase()).toBe(
        "textarea",
      );
    });

    it("starts with 1 row", () => {
      render(<Input />);
      expect(screen.getByRole("textbox")).toHaveAttribute("rows", "1");
    });

    it("adjusts height automatically when text changes", () => {
      render(<Input />);
      const textarea = screen.getByRole("textbox") as HTMLTextAreaElement;

      // scrollHeight is used to set the height; jsdom returns 0 for scrollHeight
      // so we verify the style assignment is attempted via the attribute
      Object.defineProperty(textarea, "scrollHeight", {
        value: 80,
        configurable: true,
      });

      fireEvent.change(textarea, { target: { value: "line1\nline2\nline3" } });

      expect(textarea.style.height).toBe("80px");
    });
  });

  // value / defaultValue props
  describe("value prop", () => {
    it("displays the provided value", () => {
      render(<Input value="controlled" onChange={() => {}} />);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "controlled",
      );
    });

    it("reflects value prop changes", () => {
      const { rerender } = render(<Input value="first" onChange={() => {}} />);
      rerender(<Input value="second" onChange={() => {}} />);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "second",
      );
    });

    it("displays defaultValue when value prop is not provided", () => {
      render(<Input defaultValue="preset" />);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "preset",
      );
    });

    it("starts empty when neither value nor defaultValue is provided", () => {
      render(<Input />);
      expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe(
        "",
      );
    });
  });

  // Req 4: built-in debounce — default is no debounce
  describe("debounce behaviour", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("calls onChange immediately by default (no debounce)", () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "hello" },
      });
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("hello");
    });

    it("does not call onChange immediately when debounce is set", () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} debounce={300} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "hello" },
      });
      expect(onChange).not.toHaveBeenCalled();
    });

    it("calls onChange after the debounce delay", () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} debounce={300} />);
      fireEvent.change(screen.getByRole("textbox"), {
        target: { value: "hello" },
      });
      act(() => vi.advanceTimersByTime(300));
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("hello");
    });

    it("only fires onChange once for rapid changes within the debounce window", () => {
      const onChange = vi.fn();
      render(<Input onChange={onChange} debounce={300} />);
      const textarea = screen.getByRole("textbox");

      fireEvent.change(textarea, { target: { value: "a" } });
      fireEvent.change(textarea, { target: { value: "ab" } });
      fireEvent.change(textarea, { target: { value: "abc" } });

      act(() => vi.advanceTimersByTime(300));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith("abc");
    });
  });
});
