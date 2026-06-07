import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { createStore } from "jotai";
import type { ReactNode } from "react";

import { renderWithStore, createReduxStore } from "@/tests/renderWithStore";
import { ReflectionTracesDrawer } from "./reflection-traces-drawer";
import {
  selectReflectionById,
  upsertReflections,
} from "@/store/slices/entitiesSlice";

const getReflectionMock = vi.fn();
const getReflectionTracesMock = vi.fn();

vi.mock("@/lib/reflections-services", () => ({
  getReflection: (...args: unknown[]) => getReflectionMock(...args),
  getReflectionTraces: (...args: unknown[]) => getReflectionTracesMock(...args),
}));

vi.mock("@/components/ui/drawer", () => ({
  Drawer: ({ children }: { children: ReactNode }) => <>{children}</>,
  DrawerContent: ({ children }: { children: ReactNode }) => (
    <div>{children}</div>
  ),
  DrawerHeader: ({ children }: { children: ReactNode }) => (
    <header>{children}</header>
  ),
  DrawerTitle: ({ children }: { children: ReactNode }) => <h2>{children}</h2>,
}));

vi.mock("../traces/trace-list", () => ({
  TraceList: ({
    entries,
    isLoading,
  }: {
    entries: string[];
    isLoading: boolean;
  }) => (
    <div data-testid="trace-list">
      {isLoading ? "loading" : entries.join(",")}
    </div>
  ),
}));

describe("ReflectionTracesDrawer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getReflectionTracesMock.mockResolvedValue({
      entries: [],
      traces: [],
      reflections: [],
      users: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("opens with loading state and fetches missing reflection by id", async () => {
    getReflectionMock.mockImplementation(() => new Promise(() => {}));

    renderWithStore(
      <ReflectionTracesDrawer
        reflectionId="reflection-missing"
        open
        onClose={vi.fn()}
      />,
    );

    expect(screen.getByText("Reflection Traces")).toBeInTheDocument();
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBe(2);

    await waitFor(() => {
      expect(getReflectionMock).toHaveBeenCalledWith("reflection-missing");
      expect(getReflectionMock).toHaveBeenCalledTimes(1);
    });

    expect(screen.queryByTestId("trace-list")).not.toBeInTheDocument();
  });

  it("hydrates reflection in Redux and renders traces after fetch", async () => {
    const reflection = {
      id: "reflection-1",
      uid: "user-1",
      createdAt: 1,
      summary: "summary",
      traceIds: ["trace-1", "trace-2"],
    };
    getReflectionMock.mockResolvedValue(reflection);

    const { reduxStore } = renderWithStore(
      <ReflectionTracesDrawer
        reflectionId="reflection-1"
        open
        onClose={vi.fn()}
      />,
    );

    await waitFor(() => {
      expect(screen.getByTestId("trace-list")).toHaveTextContent(
        "trace-1,trace-2",
      );
    });

    await waitFor(() => {
      expect(getReflectionTracesMock).toHaveBeenCalledWith(
        "reflection-1",
        "bottom",
      );
    });

    expect(
      selectReflectionById(reduxStore.getState(), "reflection-1"),
    ).toMatchObject(reflection);
  });

  it("uses cached reflection and skips getReflection fetch", async () => {
    const reflection = {
      id: "reflection-cached",
      uid: "user-1",
      createdAt: 1,
      summary: "summary",
      traceIds: ["trace-1"],
    };

    const reduxStore = createReduxStore();
    reduxStore.dispatch(upsertReflections([reflection]));

    renderWithStore(
      <ReflectionTracesDrawer
        reflectionId="reflection-cached"
        open
        onClose={vi.fn()}
      />,
      createStore(),
      reduxStore,
    );

    await waitFor(() => {
      expect(screen.getByTestId("trace-list")).toHaveTextContent("trace-1");
    });

    expect(getReflectionMock).not.toHaveBeenCalled();
  });
});
