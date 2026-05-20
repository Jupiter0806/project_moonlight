import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import entitiesReducer, {
  selectReflectionById,
  selectTraceById,
  selectTraceError,
  selectTraceFetchStatus,
  upsertReflections,
  upsertTraces,
} from "@/store/slices/entitiesSlice";
import urtReducer, {
  appendEntries,
  prependEntries,
  selectURTEntries,
} from "@/store/slices/urtSlice";
import sessionReducer from "@/store/slices/sessionSlice";
import { useFlushChamberTraces } from "./useFlushChamberTraces";
import { flushChamberTraces } from "@/lib/chamberTraceService";
import type { TranslationTrace } from "@/types/Trace";
import type { RootState } from "@/store/store";
import type { URTEntry } from "@/store/types";

vi.mock("@/lib/chamberTraceService", () => ({
  flushChamberTraces: vi.fn(),
}));

function createTestStore() {
  return configureStore({
    reducer: {
      session: sessionReducer,
      urt: urtReducer,
      entities: entitiesReducer,
    },
  });
}

function makeTrace(id: string): TranslationTrace {
  return {
    id,
    createdAt: Date.now(),
    q: "hello",
    a: "hola",
    user: "user-1",
    reflection: "",
    liked: null,
    type: "translation",
    sourceLang: "en",
    targetLang: "zh-CN",
  };
}

const getContentId = (entry: URTEntry | undefined) => {
  if (!entry || entry.type === "timeline-cursor") return undefined;
  return entry.content.id;
};

describe("useFlushChamberTraces", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("no-ops when chamber timeline is empty", async () => {
    const store = createTestStore();

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useFlushChamberTraces(), { wrapper });

    await act(async () => {
      await result.current();
    });

    expect(flushChamberTraces).not.toHaveBeenCalled();
  });

  it("optimistically clears chamber traces and reconciles with server reflection id", async () => {
    const store = createTestStore();
    const trace = makeTrace("trace-1");

    store.dispatch(upsertTraces([trace]));
    store.dispatch(
      upsertReflections([
        {
          id: "existing-reflection",
          createdAt: Date.now() - 1_000,
          summary: "existing",
          uid: "user-1",
          traceIds: [],
        },
      ]),
    );
    store.dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [
          {
            type: "trace",
            entryId: "entry-trace-1",
            content: { id: "trace-1", displayType: "translation-trace" },
          },
        ],
      }),
    );
    store.dispatch(
      appendEntries({
        timeline: "camphorReflections",
        entries: [
          {
            type: "reflection",
            entryId: "entry-existing-reflection",
            content: { id: "existing-reflection", displayType: "reflection" },
          },
        ],
      }),
    );

    const root = () => store.getState() as unknown as RootState;

    let resolvePromise!: (value: {
      status: "ok";
      reflectionId: string;
      traceIds: string[];
      summary: string;
      summaryGenerated: boolean;
    }) => void;

    const pending = new Promise<{
      status: "ok";
      reflectionId: string;
      traceIds: string[];
      summary: string;
      summaryGenerated: boolean;
    }>((resolve) => {
      resolvePromise = resolve;
    });

    vi.mocked(flushChamberTraces).mockReturnValue(pending);

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useFlushChamberTraces(), { wrapper });

    let runPromise: Promise<void>;
    act(() => {
      runPromise = result.current();
    });

    const optimisticEntries = selectURTEntries("chamberTraces")(root());
    expect(optimisticEntries).toEqual([]);

    const optimisticTrace = selectTraceById(root(), "trace-1");
    expect(optimisticTrace?.reflection.startsWith("temp-reflection-")).toBe(
      true,
    );

    const optimisticReflectionEntries =
      selectURTEntries("camphorReflections")(root());
    expect(
      getContentId(optimisticReflectionEntries[0])?.startsWith(
        "temp-reflection-",
      ),
    ).toBe(true);

    // Simulate a newer reflection arriving while flush is still pending.
    store.dispatch(
      prependEntries({
        timeline: "camphorReflections",
        entries: [
          {
            type: "reflection",
            entryId: "entry-incoming-reflection",
            content: { id: "incoming-reflection", displayType: "reflection" },
          },
        ],
      }),
    );

    expect(selectTraceFetchStatus("trace-1")(root())).toBe("loading");

    resolvePromise({
      status: "ok",
      reflectionId: "reflection-1",
      traceIds: ["trace-1"],
      summary: "summary",
      summaryGenerated: true,
    });

    await act(async () => {
      await runPromise;
    });

    const settledEntries = selectURTEntries("chamberTraces")(root());
    expect(settledEntries).toEqual([]);

    const settledReflectionEntries =
      selectURTEntries("camphorReflections")(root());
    expect(getContentId(settledReflectionEntries[0])).toBe(
      "incoming-reflection",
    );
    expect(getContentId(settledReflectionEntries[1])).toBe("reflection-1");
    expect(getContentId(settledReflectionEntries[2])).toBe(
      "existing-reflection",
    );

    const settledReflection = selectReflectionById(root(), "reflection-1");
    expect(settledReflection?.summary).toBe("summary");

    const settledTrace = selectTraceById(root(), "trace-1");
    expect(settledTrace?.reflection).toBe("reflection-1");
    expect(selectTraceFetchStatus("trace-1")(root())).toBe("done");
  });

  it("rolls back entries and traces when flush fails", async () => {
    const store = createTestStore();
    const root = () => store.getState() as unknown as RootState;
    const trace = makeTrace("trace-1");

    store.dispatch(upsertTraces([trace]));
    store.dispatch(
      upsertReflections([
        {
          id: "existing-reflection",
          createdAt: Date.now() - 1_000,
          summary: "existing",
          uid: "user-1",
          traceIds: [],
        },
      ]),
    );
    store.dispatch(
      appendEntries({
        timeline: "chamberTraces",
        entries: [
          {
            type: "trace",
            entryId: "entry-trace-1",
            content: { id: "trace-1", displayType: "translation-trace" },
          },
        ],
      }),
    );
    store.dispatch(
      appendEntries({
        timeline: "camphorReflections",
        entries: [
          {
            type: "reflection",
            entryId: "entry-existing-reflection",
            content: { id: "existing-reflection", displayType: "reflection" },
          },
        ],
      }),
    );

    vi.mocked(flushChamberTraces).mockRejectedValue(new Error("Flush failed"));

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useFlushChamberTraces(), { wrapper });

    await act(async () => {
      await result.current();
    });

    const rolledBackEntries = selectURTEntries("chamberTraces")(root());
    expect(rolledBackEntries).toHaveLength(1);

    const rolledBackReflectionEntries =
      selectURTEntries("camphorReflections")(root());
    expect(rolledBackReflectionEntries).toHaveLength(1);
    expect(getContentId(rolledBackReflectionEntries[0])).toBe(
      "existing-reflection",
    );

    const rolledBackTrace = selectTraceById(root(), "trace-1");
    expect(rolledBackTrace?.reflection).toBe("");
    expect(selectTraceFetchStatus("trace-1")(root())).toBe("error");
    expect(selectTraceError("trace-1")(root())).toBe("Flush failed");
  });
});
