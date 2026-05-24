import { createStore } from "jotai";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { selectedMoonlightHistoryDateAtom } from "@/atoms/moonlight-history-atoms";
import { Moonlight } from "./moonlight";
import { useMoonlightView } from "@/features/moonlight/useMoonlightView";
import { Provider } from "jotai";

vi.mock("@/features/moonlight/useMoonlightView", () => ({
  useMoonlightView: vi.fn(),
}));

vi.mock("@/features/moonlight/moonlight-display-widget", () => ({
  MoonlightDisplayWidget: ({ moonlight }: { moonlight: { id: string } }) => (
    <div data-testid="moonlight-display">moonlight {moonlight.id}</div>
  ),
}));

vi.mock("@/features/moonlight/moonlight-entry-widget", () => ({
  MoonlightEntryWidget: ({
    variant,
    selectedDate,
  }: {
    variant: "today" | "history";
    selectedDate?: string;
  }) => (
    <div data-testid="moonlight-entry">
      entry {variant} {selectedDate}
    </div>
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
      "entry history 2026-05-23",
    );
  });

  it("clears selected history date when go back to today is clicked", () => {
    vi.mocked(useMoonlightView).mockReturnValue({
      mode: "history",
      selectedDate: "2026-05-24",
      isLoading: false,
      moonlight: null,
      error: null,
      canGenerateMoonlight: false,
      onGenerate: async () => {},
    });

    const jotaiStore = createStore();
    jotaiStore.set(selectedMoonlightHistoryDateAtom, "2026-05-24");

    render(
      <Provider store={jotaiStore}>
        <Moonlight />
      </Provider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Go back to today" }));

    expect(jotaiStore.get(selectedMoonlightHistoryDateAtom)).toBeNull();
  });
});
