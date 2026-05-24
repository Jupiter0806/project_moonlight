import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";
import { moonlightDatesRatelimit } from "@/lib/rateLimit";
import { authenticate } from "@/lib/apis-helpers";
import { listMoonlightHistoryDates } from "@/server/moonlight/listMoonlightHistoryDates";

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
  listMoonlightHistoryDates: vi.fn(async () => ({
    month: "2026-05",
    availableDates: ["2026-05-08", "2026-05-14", "2026-05-19", "2026-05-24"],
  })),
}));

describe("GET /api/moonlight/dates", () => {
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

  it("returns history dates for a valid month", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/dates?month=2026-05"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      month: "2026-05",
      availableDates: ["2026-05-08", "2026-05-14", "2026-05-19", "2026-05-24"],
    });
    expect(listMoonlightHistoryDates).toHaveBeenCalled();
  });

  it("returns 400 for an invalid month", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/dates?month=May-2026"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "Invalid month",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(authenticate).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/dates?month=2026-05"),
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
      new NextRequest("http://localhost/api/moonlight/dates?month=2026-05"),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: "Too many requests",
    });
    expect(response.headers.get("X-RateLimit-Limit")).toBe("20");
    expect(response.headers.get("X-RateLimit-Remaining")).toBe("0");
  });
});
