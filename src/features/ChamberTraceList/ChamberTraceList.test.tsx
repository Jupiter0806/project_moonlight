import { describe, it, expect, vi } from "vitest";
import { screen, act } from "@testing-library/react";
import type { ReactNode } from "react";
import { Fragment } from "react";
import { ChamberTraceList } from "./ChamberTraceList";
import { renderWithStore, createReduxStore } from "@/tests/renderWithStore";
import { appendEntries } from "@/store/slices/urtSlice";
import type { URTEntryUI } from "@/store/types";

vi.mock("@/store/api/timelineApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("@/store/api/timelineApi")>();

  return {
    ...actual,
    useGetTimelineQuery: vi.fn(() => ({})),
  };
});

vi.mock("@/components/virtual-list", () => ({
  VirtualList: ({
    items,
    isLoading,
    emptyState,
    renderRow,
  }: {
    items: unknown[];
    isLoading: boolean;
    emptyState: ReactNode;
    renderRow: (item: unknown, index: number) => ReactNode;
  }) => {
    if (isLoading) {
      return (
        <div className="flex h-full items-center justify-center">
          <p className="text-sm">Loading...</p>
        </div>
      );
    }

    if (items.length === 0) {
      return <>{emptyState}</>;
    }

    return (
      <>
        {items.map((item, index) => (
          <Fragment key={index}>{renderRow(item, index)}</Fragment>
        ))}
      </>
    );
  },
}));

// Trace delegates to QATrace/TranslateTrace which both hit the Redux store for
// the actual trace entity. Mocking Trace keeps these tests focused solely on
// ChamberTraceList's responsibilities: reading chamberTraces entries and wiring
// props correctly.
vi.mock("@/features/traces/trace", () => ({
  Trace: ({
    traceId,
    displayType,
  }: {
    traceId: string;
    displayType: string;
  }) => (
    <div
      data-testid="trace"
      data-trace-id={traceId}
      data-display-type={displayType}
    />
  ),
}));

const makeEntry = (
  id: string,
  displayType: URTEntryUI["content"]["displayType"] = "qa-trace",
): URTEntryUI => ({
  type: "trace",
  entryId: `entry-${id}`,
  content: { id, displayType },
});

describe("ChamberTraceList", () => {
  it("renders nothing when the chamberTraces timeline is empty", () => {
    const { container } = renderWithStore(<ChamberTraceList />);
    expect(container.querySelectorAll("[data-testid='trace']")).toHaveLength(0);
  });

  it("renders one Trace per entry in the store", () => {
    const store = createReduxStore();
    store.dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [makeEntry("t1"), makeEntry("t2"), makeEntry("t3")],
      }),
    );

    renderWithStore(<ChamberTraceList />, undefined, store);

    expect(screen.getAllByTestId("trace")).toHaveLength(3);
  });

  it("passes the correct traceId to each Trace", () => {
    const store = createReduxStore();
    store.dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [makeEntry("trace-abc"), makeEntry("trace-xyz")],
      }),
    );

    renderWithStore(<ChamberTraceList />, undefined, store);

    const traces = screen.getAllByTestId("trace");
    const ids = traces.map((el) => el.getAttribute("data-trace-id"));
    expect(ids).toEqual(["trace-abc", "trace-xyz"]);
  });

  it("passes the correct displayType to each Trace", () => {
    const store = createReduxStore();
    store.dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [
          makeEntry("t1", "qa-trace"),
          makeEntry("t2", "translation-trace"),
        ],
      }),
    );

    renderWithStore(<ChamberTraceList />, undefined, store);

    const traces = screen.getAllByTestId("trace");
    expect(traces[0].getAttribute("data-display-type")).toBe("qa-trace");
    expect(traces[1].getAttribute("data-display-type")).toBe(
      "translation-trace",
    );
  });

  it("reflects new entries dispatched after initial render", () => {
    const store = createReduxStore();
    store.dispatch(
      appendEntries({ timeline: "chamberTraces", entries: [makeEntry("t1")] }),
    );

    renderWithStore(<ChamberTraceList />, undefined, store);
    expect(screen.getAllByTestId("trace")).toHaveLength(1);

    act(() => {
      store.dispatch(
        appendEntries({
          timeline: "chamberTraces",
          entries: [makeEntry("t2")],
        }),
      );
    });
    expect(screen.getAllByTestId("trace")).toHaveLength(2);
  });

  it("does not render entries from other timelines", () => {
    const store = createReduxStore();
    store.dispatch(
      appendEntries({
        timeline: "camphorTraces",
        entries: [makeEntry("t-other")],
      }),
    );

    renderWithStore(<ChamberTraceList />, undefined, store);

    expect(screen.queryAllByTestId("trace")).toHaveLength(0);
  });
});
