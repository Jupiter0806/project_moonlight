import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Button } from "./Button";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   - Renders as a div element
//   - Accepts children as inner content
//   - Accepts onClick prop

describe("Button", () => {
  describe("element", () => {
    it("renders as a div element", () => {
      render(<Button />);
      expect(screen.getByRole("button").tagName.toLowerCase()).toBe("div");
    });

    it("is keyboard accessible with role=button", () => {
      render(<Button />);
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  describe("children", () => {
    it("renders text children", () => {
      render(<Button>Click me</Button>);
      expect(screen.getByText("Click me")).toBeInTheDocument();
    });

    it("renders node children", () => {
      render(
        <Button>
          <span data-testid="inner">icon</span>
        </Button>,
      );
      expect(screen.getByTestId("inner")).toBeInTheDocument();
    });

    it("renders without children without throwing", () => {
      expect(() => render(<Button />)).not.toThrow();
    });
  });

  describe("onClick", () => {
    it("calls onClick when clicked", () => {
      const onClick = vi.fn();
      render(<Button onClick={onClick}>Click</Button>);
      fireEvent.click(screen.getByRole("button"));
      expect(onClick).toHaveBeenCalledOnce();
    });

    it("does not throw when clicked without an onClick handler", () => {
      render(<Button>Click</Button>);
      expect(() => fireEvent.click(screen.getByRole("button"))).not.toThrow();
    });
  });
});
