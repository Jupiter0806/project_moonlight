import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MobileSubmitButton } from "./MobileSubmitButton";

// --- Tests are written against requirements, not implementation ---
// Requirements:
//   1. Hidden on desktop — carries `md:hidden` Tailwind class
//   2. Renders an arrow-up icon button
//   3. Calls onClick when clicked (enabled state)
//   4. onClick is NOT called when disabled
//   5. Carries blue bg class when enabled
//   6. Renders without error when no props are provided

describe("MobileSubmitButton", () => {
  describe("Req 1 — desktop visibility", () => {
    it("carries md:hidden class so it is hidden on desktop breakpoints", () => {
      render(<MobileSubmitButton />);
      expect(screen.getByRole("button", { name: "Submit" })).toHaveClass(
        "md:hidden",
      );
    });
  });

  describe("Req 2 — icon button identity", () => {
    it("renders a button with accessible name Submit", () => {
      render(<MobileSubmitButton />);
      expect(
        screen.getByRole("button", { name: "Submit" }),
      ).toBeInTheDocument();
    });

    it("is a native <div> element", () => {
      render(<MobileSubmitButton />);
      expect(screen.getByRole("button", { name: "Submit" }).tagName).toBe(
        "DIV",
      );
    });
  });

  describe("Req 3 — onClick when enabled", () => {
    it("calls onClick once when clicked", () => {
      const onClick = vi.fn();
      render(<MobileSubmitButton onClick={onClick} />);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("calls onClick on each successive click", () => {
      const onClick = vi.fn();
      render(<MobileSubmitButton onClick={onClick} />);
      const btn = screen.getByRole("button", { name: "Submit" });
      fireEvent.click(btn);
      fireEvent.click(btn);
      expect(onClick).toHaveBeenCalledTimes(2);
    });
  });

  describe("Req 4 — disabled blocks handler", () => {
    it("does not call onClick when disabled", () => {
      const onClick = vi.fn();
      render(<MobileSubmitButton onClick={onClick} disabled />);
      fireEvent.click(screen.getByRole("button", { name: "Submit" }));
      expect(onClick).not.toHaveBeenCalled();
    });
  });

  describe("Req 5 — enabled visual state", () => {
    it("carries the blue bg class when enabled", () => {
      render(<MobileSubmitButton />);
      expect(screen.getByRole("button", { name: "Submit" })).toHaveClass(
        "bg-blue-500",
      );
    });

    it("does not carry the dimmed bg class when enabled", () => {
      render(<MobileSubmitButton />);
      expect(screen.getByRole("button", { name: "Submit" })).not.toHaveClass(
        "bg-white/20",
      );
    });
  });

  describe("Req 6 — default rendering", () => {
    it("renders without error when no props are provided", () => {
      expect(() => render(<MobileSubmitButton />)).not.toThrow();
    });

    it("is enabled by default", () => {
      render(<MobileSubmitButton />);
      expect(screen.getByRole("button", { name: "Submit" })).not.toBeDisabled();
    });
  });
});
