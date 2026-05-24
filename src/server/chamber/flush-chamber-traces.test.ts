import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  FlushChamberTracesError,
  flushChamberTraces,
} from "@/server/chamber/flush-chamber-traces";
import { fetchAnswer } from "@/server/chamber/fetchAnswer";

vi.mock("@/server/chamber/fetchAnswer", () => ({
  fetchAnswer: vi.fn(),
}));

describe("flushChamberTraces", () => {
  const DISABLED_SUMMARY =
    "[Summary generation is currently disabled for testing purposes]";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchAnswer).mockResolvedValue(DISABLED_SUMMARY);
  });

  it("creates one reflection with all trace ids and summary", async () => {
    const reflectionSet = vi.fn();
    const traceSet = vi.fn();
    const batchDelete = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);

    const reflectionRef = { id: "reflection-1" };

    const docRef1 = { id: "trace-1" };
    const docRef2 = { id: "trace-2" };

    const chamberDocs = [
      {
        ref: docRef1,
        data: () => ({
          id: "trace-1",
          type: "qa",
          q: "What is Jotai?",
          a: "State library",
          user: "user-1",
          reflection: "",
          createdAt: 1,
        }),
      },
      {
        ref: docRef2,
        data: () => ({
          id: "trace-2",
          type: "translation",
          q: "hello",
          a: "hola",
          user: "user-1",
          reflection: "",
          sourceLang: "en",
          targetLang: "es",
          createdAt: 2,
        }),
      },
    ];

    const tracesSnapshot = {
      empty: false,
      docs: chamberDocs,
      forEach: (cb: (doc: (typeof chamberDocs)[number]) => void) =>
        chamberDocs.forEach(cb),
    };

    const chamberTracesCollection = {
      get: vi.fn().mockResolvedValue(tracesSnapshot),
    };

    const chamberDoc = {
      collection: vi.fn().mockReturnValue(chamberTracesCollection),
    };

    const reflectionsCollection = {
      doc: vi.fn().mockReturnValue(reflectionRef),
    };

    const rootTracesCollection = {
      doc: vi.fn((id: string) => ({ id })),
    };

    const aggregateCollection = {
      doc: vi.fn((id: string) => ({ id })),
    };

    const aggregateRootCollection = {
      doc: vi.fn(() => ({
        collection: vi.fn(() => aggregateCollection),
      })),
    };

    const chambersCollection = {
      doc: vi.fn().mockReturnValue(chamberDoc),
    };

    const batch = {
      set: vi.fn((ref: { id: string }) => {
        if (ref.id === "reflection-1") {
          reflectionSet();
        } else {
          traceSet();
        }
      }),
      delete: batchDelete,
      commit,
    };

    const db = {
      collection: vi.fn((name: string) => {
        if (name === "chambers") return chambersCollection;
        if (name === "reflections") return reflectionsCollection;
        if (name === "traces") return rootTracesCollection;
        if (name === "moonlightReflectionDailyCounts")
          return aggregateRootCollection;
        throw new Error(`Unexpected collection: ${name}`);
      }),
      batch: vi.fn(() => batch),
    } as unknown as Parameters<typeof flushChamberTraces>[0];

    const result = await flushChamberTraces(db, "user-1");

    expect(fetchAnswer).toHaveBeenCalledTimes(1);
    expect(reflectionSet).toHaveBeenCalledTimes(1);
    expect(traceSet).toHaveBeenCalledTimes(3);

    const setCalls = (batch.set as unknown as { mock: { calls: unknown[][] } })
      .mock.calls;
    const reflectionBatchCall = setCalls.find(
      (call) => (call[0] as { id?: string } | undefined)?.id === "reflection-1",
    );
    expect(reflectionBatchCall?.[1]).toMatchObject({
      id: "reflection-1",
      uid: "user-1",
      traceIds: ["trace-1", "trace-2"],
      summary: DISABLED_SUMMARY,
    });

    const rootTraceCalls = setCalls.filter(
      (call) => (call[0] as { id?: string } | undefined)?.id !== "reflection-1",
    );

    expect(rootTraceCalls).toHaveLength(3);
    expect(rootTraceCalls[0]?.[1]).toMatchObject({
      id: "trace-1",
      uid: "user-1",
      reflection: "reflection-1",
      reflectionId: "reflection-1",
    });
    expect(rootTraceCalls[1]?.[1]).toMatchObject({
      id: "trace-2",
      uid: "user-1",
      reflection: "reflection-1",
      reflectionId: "reflection-1",
    });
    expect(rootTraceCalls[2]?.[1]).toMatchObject({
      date: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
      count: expect.anything(),
    });

    expect(batchDelete).toHaveBeenCalledTimes(2);
    expect(batchDelete).toHaveBeenCalledWith(docRef1);
    expect(batchDelete).toHaveBeenCalledWith(docRef2);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      reflectionId: "reflection-1",
      traceIds: ["trace-1", "trace-2"],
      summary: DISABLED_SUMMARY,
      summaryGenerated: true,
    });
  });

  it("throws EMPTY_CHAMBER when chamber has no traces", async () => {
    const tracesSnapshot = {
      empty: true,
      docs: [],
      forEach: vi.fn(),
    };

    const chamberTracesCollection = {
      get: vi.fn().mockResolvedValue(tracesSnapshot),
    };

    const chamberDoc = {
      collection: vi.fn().mockReturnValue(chamberTracesCollection),
    };

    const chambersCollection = {
      doc: vi.fn().mockReturnValue(chamberDoc),
    };

    const db = {
      collection: vi.fn((name: string) => {
        if (name === "chambers") return chambersCollection;
        throw new Error(`Unexpected collection: ${name}`);
      }),
      batch: vi.fn(),
    } as unknown as Parameters<typeof flushChamberTraces>[0];

    await expect(flushChamberTraces(db, "user-1")).rejects.toMatchObject({
      name: "FlushChamberTracesError",
      code: "EMPTY_CHAMBER",
      message: "No traces found in chamber",
    } satisfies Partial<FlushChamberTracesError>);

    expect(fetchAnswer).not.toHaveBeenCalled();
    expect(db.batch).not.toHaveBeenCalled();
  });

  it("still flushes traces when summary generation fails", async () => {
    const batchDelete = vi.fn();
    const commit = vi.fn().mockResolvedValue(undefined);

    const chamberDocs = [
      {
        ref: { id: "trace-1" },
        data: () => ({
          id: "trace-1",
          type: "qa",
          q: "Q",
          a: "A",
          user: "user-1",
          reflection: "",
          createdAt: 1,
        }),
      },
    ];

    const tracesSnapshot = {
      empty: false,
      docs: chamberDocs,
      forEach: (cb: (doc: (typeof chamberDocs)[number]) => void) =>
        chamberDocs.forEach(cb),
    };

    const chamberTracesCollection = {
      get: vi.fn().mockResolvedValue(tracesSnapshot),
    };

    const chamberDoc = {
      collection: vi.fn().mockReturnValue(chamberTracesCollection),
    };

    const reflectionsCollection = {
      doc: vi.fn().mockReturnValue({ id: "reflection-1" }),
    };

    const rootTracesCollection = {
      doc: vi.fn((id: string) => ({ id })),
    };

    const aggregateCollection = {
      doc: vi.fn((id: string) => ({ id })),
    };

    const aggregateRootCollection = {
      doc: vi.fn(() => ({
        collection: vi.fn(() => aggregateCollection),
      })),
    };

    const chambersCollection = {
      doc: vi.fn().mockReturnValue(chamberDoc),
    };

    const batch = {
      set: vi.fn(),
      delete: batchDelete,
      commit,
    };

    const db = {
      collection: vi.fn((name: string) => {
        if (name === "chambers") return chambersCollection;
        if (name === "reflections") return reflectionsCollection;
        if (name === "traces") return rootTracesCollection;
        if (name === "moonlightReflectionDailyCounts")
          return aggregateRootCollection;
        throw new Error(`Unexpected collection: ${name}`);
      }),
      batch: vi.fn(() => batch),
    } as unknown as Parameters<typeof flushChamberTraces>[0];

    vi.mocked(fetchAnswer).mockRejectedValue(new Error("generation failed"));

    const result = await flushChamberTraces(db, "user-1");

    const setCalls = (batch.set as unknown as { mock: { calls: unknown[][] } })
      .mock.calls;
    const reflectionBatchCall = setCalls.find(
      (call) => (call[0] as { id?: string } | undefined)?.id === "reflection-1",
    );
    expect(reflectionBatchCall?.[1]).toMatchObject({
      summary: "",
      traceIds: ["trace-1"],
    });
    expect(batchDelete).toHaveBeenCalledTimes(1);
    expect(commit).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      reflectionId: "reflection-1",
      traceIds: ["trace-1"],
      summary: "",
      summaryGenerated: false,
    });
  });
});
