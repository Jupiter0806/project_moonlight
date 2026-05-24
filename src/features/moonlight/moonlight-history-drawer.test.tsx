import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

import { MoonlightHistoryDrawer } from "./moonlight-history-drawer";

const calendarMock = vi.fn((props: Record<string, unknown>) => (
  <div data-testid="calendar" />
));

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
  it("passes mock available dates to the calendar", () => {
    render(<MoonlightHistoryDrawer open onOpenChange={vi.fn()} />);

    expect(screen.getByTestId("calendar")).toBeInTheDocument();

    const calendarProps = calendarMock.mock.calls[0][0] as {
      modifiers?: { available?: Date[] };
      className?: string;
    };

    expect(calendarProps.modifiers?.available).toHaveLength(4);
    expect(calendarProps.className).toContain("max-w-md");
  });
});
