import { describe, expect, it, vi } from "vitest";
import { listChamberTraces } from "@/server/chamber/listChamberTraces";

describe("listChamberTraces", () => {
  it("returns empty timeline payload when no traces", async () => {
    const emptyGet = vi.fn().mockResolvedValue({ docs: [], empty: true });
    const chain = {
      orderBy: vi.fn().mockReturnThis(),
      endBefore: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      limitToLast: vi.fn().mockReturnThis(),
      get: emptyGet,
    };

    const db = {
      collection: vi.fn().mockReturnValue({
        doc: vi.fn().mockReturnValue({
          collection: vi.fn().mockReturnValue(chain),
        }),
      }),
    } as unknown as Parameters<typeof listChamberTraces>[0];

    const result = await listChamberTraces(db, {
      uid: "user-1",
      direction: "bottom",
      limit: 20,
    });

    expect(result.entries).toEqual([]);
    expect(result.traces).toEqual([]);
    expect(result.reflections).toEqual([]);
    expect(result.users).toEqual([]);
    expect(result.topCursor).toBeUndefined();
    expect(result.bottomCursor).toBeUndefined();
  });
});
