import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";

import { MoonlightHistoryDrawer } from "./moonlight-history-drawer";

const calendarMock = vi.fn(() => <div data-testid="calendar" />);

vi.mock("@/components/ui/calendar", () => ({
  Calendar: (props: Record<string, unknown>) => calendarMock(props),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerDescription: ({ children }: { children: React.ReactNode }) => (
    <p>{children}</p>
  ),
  DrawerHeader: ({ children }: { children: React.ReactNode }) => (
    <header>{children}</header>
  ),
  DrawerTitle: ({ children }: { children: React.ReactNode }) => (
    <h2>{children}</h2>
  ),
}));

describe("MoonlightHistoryDrawer", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              status: "ok",
              month: "2026-05",
              availableDates: ["2026-05-08", "2026-05-14", "2026-05-19"],
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    calendarMock.mockClear();
  });

  it("passes api-loaded available dates to the calendar", async () => {
    render(<MoonlightHistoryDrawer open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("calendar")).toBeInTheDocument();

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/^\/api\/moonlight\/dates\?month=\d{4}-\d{2}$/),
        expect.objectContaining({
          signal: expect.any(AbortSignal),
        }),
      );
    });

    await waitFor(() => {
      const latestCall = calendarMock.mock.calls.at(-1);
      const calendarProps = latestCall?.[0] as {
        modifiers?: { available?: Date[] };
      };
      expect(calendarProps.modifiers?.available).toHaveLength(3);
    });

    const calendarProps = calendarMock.mock.calls[0][0] as {
      className?: string;
    };

    expect(calendarProps.className).toContain("max-w-md");
  });
});
