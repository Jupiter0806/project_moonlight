import { describe, expect, it, vi } from "vitest";
import type { TranslationTrace } from "@/types/Trace";
import {
  getTraceInUserChamber,
  isTranslationTrace,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

const trace: TranslationTrace = {
  id: "trace-1",
  createdAt: 1712649700000,
  q: "Hello",
  a: "你好",
  user: "user-1",
  reflection: "",
  liked: null,
  type: "translation",
  sourceLang: "en",
  targetLang: "zh-CN",
};

describe("isTranslationTrace", () => {
  it("accepts a valid translation trace shape", () => {
    expect(isTranslationTrace(trace)).toBe(true);
  });

  it("accepts a valid qa trace shape", () => {
    expect(
      isTranslationTrace({
        ...trace,
        type: "qa",
        a: "",
      }),
    ).toBe(true);
  });

  it("rejects malformed payload", () => {
    expect(
      isTranslationTrace({
        ...trace,
        createdAt: "not-a-number",
      }),
    ).toBe(false);
  });
});

describe("upsertTraceInUserChamber", () => {
  it("creates/updates chamber metadata and trace doc", async () => {
    const chamberSet = vi.fn().mockResolvedValue(undefined);
    const traceSet = vi.fn().mockResolvedValue(undefined);

    const traceDoc = vi.fn().mockReturnValue({ set: traceSet });
    const tracesCollection = vi.fn().mockReturnValue({ doc: traceDoc });

    const chamberDoc = vi.fn().mockReturnValue({
      set: chamberSet,
      collection: tracesCollection,
    });

    const collection = vi.fn().mockReturnValue({ doc: chamberDoc });
    const db = { collection } as unknown as Parameters<
      typeof upsertTraceInUserChamber
    >[0];

    await upsertTraceInUserChamber(db, "user-1", trace);

    expect(collection).toHaveBeenCalledWith("chambers");
    expect(chamberDoc).toHaveBeenCalledWith("user-1");
    expect(chamberSet).toHaveBeenCalledTimes(1);
    expect(tracesCollection).toHaveBeenCalledWith("traces");
    expect(traceDoc).toHaveBeenCalledWith("trace-1");
    expect(traceSet).toHaveBeenCalledTimes(1);
  });
});

describe("getTraceInUserChamber", () => {
  it("returns null when trace does not exist", async () => {
    const get = vi.fn().mockResolvedValue({ exists: false });
    const docByTrace = vi.fn().mockReturnValue({ get });
    const tracesCollection = vi.fn().mockReturnValue({ doc: docByTrace });
    const chamberDoc = vi
      .fn()
      .mockReturnValue({ collection: tracesCollection });
    const collection = vi.fn().mockReturnValue({ doc: chamberDoc });
    const db = { collection } as unknown as Parameters<
      typeof getTraceInUserChamber
    >[0];

    await expect(getTraceInUserChamber(db, "user-1", "trace-1")).resolves.toBe(
      null,
    );
  });

  it("returns existing trace when found", async () => {
    const get = vi.fn().mockResolvedValue({
      exists: true,
      data: () => trace,
    });
    const docByTrace = vi.fn().mockReturnValue({ get });
    const tracesCollection = vi.fn().mockReturnValue({ doc: docByTrace });
    const chamberDoc = vi
      .fn()
      .mockReturnValue({ collection: tracesCollection });
    const collection = vi.fn().mockReturnValue({ doc: chamberDoc });
    const db = { collection } as unknown as Parameters<
      typeof getTraceInUserChamber
    >[0];

    await expect(
      getTraceInUserChamber(db, "user-1", "trace-1"),
    ).resolves.toEqual(trace);
  });
});
