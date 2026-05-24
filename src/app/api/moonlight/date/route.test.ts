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

describe("GET /api/moonlight/date", () => {
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

  it("returns selected date moonlight for existing mock data", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-24"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      date: "2026-05-24",
      exists: true,
      moonlight: {
        id: "2026-05-24",
        reflectionCount: 2,
      },
    });
  });

  it("returns exists false when mock moonlight is not found", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-23"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      date: "2026-05-23",
      exists: false,
    });
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
});
