import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";
import { moonlightDatesRatelimit } from "@/lib/rateLimit";

vi.mock("@/lib/rateLimit", () => ({
  moonlightDatesRatelimit: {
    limit: vi.fn(),
  },
}));

vi.mock("@/lib/getRequestKey", () => ({
  getRequestKey: vi.fn(async () => "request-key"),
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
  });

  it("returns mock dates for a valid month", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/dates?month=2026-05"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      month: "2026-05",
      availableDates: ["2026-05-08", "2026-05-14", "2026-05-19", "2026-05-24"],
    });
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
    expect(response.headers.get("X-RateLimit-Reset")).not.toBeNull();
  });
});
