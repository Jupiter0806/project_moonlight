import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders card content", () => {
    render(<Card />);
    expect(screen.getByText("card")).toBeInTheDocument();
  });
});
