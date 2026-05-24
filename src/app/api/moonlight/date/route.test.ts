import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET, POST } from "./route";
import { moonlightDatesRatelimit } from "@/lib/rateLimit";
import { authenticate } from "@/lib/apis-helpers";
import {
  GenerateMoonlightHistoryError,
  generateMoonlightHistoryByDate,
  getMoonlightHistoryByDate,
} from "@/server/moonlight/listMoonlightHistoryDates";

vi.mock("@/lib/rateLimit", () => ({
  moonlightDatesRatelimit: {
    limit: vi.fn(),
  },
}));

vi.mock("@/lib/getRequestKey", () => ({
  getRequestKey: vi.fn(async () => "request-key"),
}));

vi.mock("@/lib/apis-helpers", () => ({
  withRateLimitHeaders: vi.fn(
    (limit: number, remaining: number, reset: number) => ({
      "X-RateLimit-Limit": String(limit),
      "X-RateLimit-Remaining": String(remaining),
      "X-RateLimit-Reset": String(reset),
      "Retry-After": "1",
    }),
  ),
  authenticate: vi.fn(async () => "test-uid"),
}));

vi.mock("@/lib/firebaseAdmin", () => ({
  getAdminFirestore: vi.fn(() => ({}) as unknown),
}));

vi.mock("@/server/moonlight/listMoonlightHistoryDates", () => ({
  GenerateMoonlightHistoryError: class MockGenerateMoonlightHistoryError extends Error {
    code: "NO_REFLECTIONS";

    constructor(code: "NO_REFLECTIONS", message: string) {
      super(message);
      this.code = code;
      this.name = "GenerateMoonlightHistoryError";
    }
  },
  getMoonlightHistoryByDate: vi.fn(async () => ({
    date: "2026-05-24",
    exists: true,
    canGenerate: false,
    moonlight: {
      id: "day-key-1",
      summary: "Summary",
      reflectionIds: ["r1", "r2"],
      reflectionCount: 2,
    },
  })),
  generateMoonlightHistoryByDate: vi.fn(async () => ({
    date: "2026-05-24",
    generated: true,
    moonlight: {
      id: "day-key-1",
      summary: "Summary",
      reflectionIds: ["r1", "r2"],
      reflectionCount: 2,
    },
  })),
}));

describe("/api/moonlight/date", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(moonlightDatesRatelimit.limit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 10_000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.mocked(authenticate).mockResolvedValue("test-uid");
  });

  it("GET returns selected date moonlight", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      date: "2026-05-24",
      exists: true,
      canGenerate: false,
      moonlight: {
        reflectionCount: 2,
      },
    });
    expect(getMoonlightHistoryByDate).toHaveBeenCalled();
  });

  it("POST generates selected date moonlight", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      date: "2026-05-24",
      generated: true,
    });
    expect(generateMoonlightHistoryByDate).toHaveBeenCalled();
  });

  it("returns 400 for invalid date", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=05-24-2026"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid date",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(authenticate).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });

  it("returns 429 when rate limit is exceeded", async () => {
    vi.mocked(moonlightDatesRatelimit.limit).mockResolvedValue({
      success: false,
      limit: 20,
      remaining: 0,
      reset: Date.now() + 10_000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests",
    });
  });

  it("POST returns 400 for no reflections", async () => {
    vi.mocked(generateMoonlightHistoryByDate).mockRejectedValue(
      new GenerateMoonlightHistoryError(
        "NO_REFLECTIONS",
        "No reflections, unable to generate.",
      ),
    );

    const response = await POST(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No reflections, unable to generate.",
    });
  });
});
