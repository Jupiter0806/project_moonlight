import { beforeEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST } from "@/app/api/chamber/traces/flush/route";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceRatelimit } from "@/lib/rateLimit";
import {
  flushChamberTraces,
  FlushChamberTracesError,
} from "@/server/chamber/flush-chamber-traces";

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: vi.fn(),
  getAdminFirestore: vi.fn(),
}));

vi.mock("@/lib/rateLimit", () => ({
  chamberTraceRatelimit: {
    limit: vi.fn(),
  },
}));

vi.mock("@/lib/getRequestKey", () => ({
  getRequestKey: vi.fn(async () => "request-key"),
}));

vi.mock("@/server/chamber/flush-chamber-traces", () => ({
  FlushChamberTracesError: class FlushChamberTracesError extends Error {
    constructor(
      public readonly code: "EMPTY_CHAMBER" | "NO_VALID_TRACES",
      message: string,
    ) {
      super(message);
      this.name = "FlushChamberTracesError";
    }
  },
  flushChamberTraces: vi.fn(),
}));

function makeRequest(sessionCookie = "session-cookie"): NextRequest {
  return {
    cookies: {
      get: vi.fn((name: string) => {
        if (name !== "__session" || !sessionCookie) return undefined;
        return { value: sessionCookie };
      }),
    },
  } as unknown as NextRequest;
}

describe("POST /api/chamber/traces/flush", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(chamberTraceRatelimit.limit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 10_000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    vi.mocked(getAdminAuth).mockReturnValue({
      verifySessionCookie: vi.fn().mockResolvedValue({ uid: "user-1" }),
    } as unknown as ReturnType<typeof getAdminAuth>);

    vi.mocked(getAdminFirestore).mockReturnValue({
      mocked: true,
    } as unknown as ReturnType<typeof getAdminFirestore>);
  });

  it("returns 200 and flush payload on success", async () => {
    vi.mocked(flushChamberTraces).mockResolvedValue({
      reflectionId: "reflection-1",
      traceIds: ["trace-1"],
      summary: "Summary",
      summaryGenerated: true,
    });

    const response = await POST(makeRequest());

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      reflectionId: "reflection-1",
      traceIds: ["trace-1"],
      summary: "Summary",
      summaryGenerated: true,
    });
  });

  it("returns 401 when request is unauthenticated", async () => {
    const response = await POST(makeRequest(""));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("maps EMPTY_CHAMBER to 400", async () => {
    vi.mocked(flushChamberTraces).mockRejectedValue(
      new FlushChamberTracesError(
        "EMPTY_CHAMBER",
        "No traces found in chamber",
      ),
    );

    const response = await POST(makeRequest());

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No traces found in chamber",
    });
  });

  it("maps NO_VALID_TRACES to 422", async () => {
    vi.mocked(flushChamberTraces).mockRejectedValue(
      new FlushChamberTracesError(
        "NO_VALID_TRACES",
        "No valid traces found in chamber",
      ),
    );

    const response = await POST(makeRequest());

    expect(response.status).toBe(422);
    await expect(response.json()).resolves.toEqual({
      error: "No valid traces found in chamber",
    });
  });
});
