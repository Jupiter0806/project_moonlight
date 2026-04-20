import { describe, expect, it, vi } from "vitest";
import type { TranslationTrace } from "@/types/Trace";
import {
  isTranslationTrace,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

const trace: TranslationTrace = {
  id: "trace-1",
  created_at: 1712649700000,
  q: "Hello",
  a: "你好",
  user: "user-1",
  reflection: "",
  type: "translation",
  sourceLang: "en",
  targetLang: "zh-CN",
};

describe("isTranslationTrace", () => {
  it("accepts a valid translation trace shape", () => {
    expect(isTranslationTrace(trace)).toBe(true);
  });

  it("rejects malformed payload", () => {
    expect(
      isTranslationTrace({
        ...trace,
        type: "qa",
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
