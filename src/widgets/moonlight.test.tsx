import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { Moonlight } from "./moonlight";
import { useMoonlightView } from "@/features/moonlight/useMoonlightView";

vi.mock("@/features/moonlight/useMoonlightView", () => ({
  useMoonlightView: vi.fn(),
}));

vi.mock("@/features/moonlight/moonlight-display-widget", () => ({
  MoonlightDisplayWidget: ({ moonlight }: { moonlight: { id: string } }) => (
    <div data-testid="moonlight-display">moonlight {moonlight.id}</div>
  ),
}));

vi.mock("@/features/moonlight/moonlight-entry-widget", () => ({
  MoonlightEntryWidget: ({ variant }: { variant: "today" | "history" }) => (
    <div data-testid="moonlight-entry">entry {variant}</div>
  ),
}));

describe("Moonlight", () => {
  it("renders selected historical moonlight on the main page", () => {
    vi.mocked(useMoonlightView).mockReturnValue({
      mode: "history",
      selectedDate: "2026-05-24",
      isLoading: false,
      moonlight: {
        id: "2026-05-24",
        summary: "Historical moonlight",
        reflectionIds: [],
        reflectionCount: 0,
      },
      error: null,
      canGenerateMoonlight: false,
      onGenerate: async () => {},
    });

    render(<Moonlight />);

    expect(screen.getByTestId("moonlight-display")).toHaveTextContent(
      "moonlight 2026-05-24",
    );
  });

  it("renders the history empty state on the main page when no historical moonlight exists", () => {
    vi.mocked(useMoonlightView).mockReturnValue({
      mode: "history",
      selectedDate: "2026-05-23",
      isLoading: false,
      moonlight: null,
      error: null,
      canGenerateMoonlight: false,
      onGenerate: async () => {},
    });

    render(<Moonlight />);

    expect(screen.getByTestId("moonlight-entry")).toHaveTextContent(
      "entry history",
    );
  });
});
