import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET, POST } from "./route";
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
      canGenerate: false,
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
      canGenerate: false,
    });
  });

  it("returns canGenerate true for dates with reflections but no moonlight", async () => {
    const response = await GET(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-19"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "ok",
      date: "2026-05-19",
      exists: false,
      canGenerate: true,
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

  it("generates historical moonlight for a date with reflections", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-08"),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "ok",
      date: "2026-05-08",
      generated: true,
      moonlight: {
        id: "2026-05-08",
      },
    });
  });

  it("returns 400 when generating a date without reflections", async () => {
    const response = await POST(
      new NextRequest("http://localhost/api/moonlight/date?date=2026-05-23"),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      error: "No reflections, unable to generate.",
    });
  });
});
