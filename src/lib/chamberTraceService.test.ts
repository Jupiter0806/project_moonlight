import { describe, expect, it, vi, beforeEach } from "vitest";
import { upsertChamberTrace } from "@/lib/chamberTraceService";
import type { TranslationTrace } from "@/types/Trace";

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

describe("upsertChamberTrace", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("returns parsed JSON on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ status: "ok", traceId: "trace-1" }),
      }),
    );

    await expect(upsertChamberTrace(trace)).resolves.toEqual({
      status: "ok",
      traceId: "trace-1",
    });
  });

  it("throws API error message when present", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => "application/json" },
        json: async () => ({ error: "Unauthorized" }),
      }),
    );

    await expect(upsertChamberTrace(trace)).rejects.toThrow("Unauthorized");
  });

  it("falls back to default error message for non-JSON responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        headers: { get: () => "text/plain" },
      }),
    );

    await expect(upsertChamberTrace(trace)).rejects.toThrow(
      "Failed to sync trace",
    );
  });
});
