import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

import { GET } from "./route";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { authenticate } from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";

vi.mock("@/lib/rateLimit", () => ({
  reflectionsRatelimit: {
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
  getAdminFirestore: vi.fn(),
}));

vi.mock("@/server/helpers/firestore-serialization", () => ({
  serializeFirestoreValue: vi.fn((value: unknown) => value),
}));

describe("/api/reflections/[reflectionId]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(reflectionsRatelimit.limit).mockResolvedValue({
      success: true,
      limit: 20,
      remaining: 19,
      reset: Date.now() + 10_000,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);
    vi.mocked(authenticate).mockResolvedValue("test-uid");
  });

  it("returns 200 when reflection exists and belongs to user", async () => {
    vi.mocked(getAdminFirestore).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: vi.fn(async () => ({
            exists: true,
            data: () => ({
              id: "reflection-1",
              uid: "test-uid",
              createdAt: 1,
              summary: "summary",
              traceIds: ["trace-1"],
            }),
          })),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const response = await GET(
      new NextRequest("http://localhost/api/reflections/reflection-1"),
      { params: Promise.resolve({ reflectionId: "reflection-1" }) },
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      id: "reflection-1",
      uid: "test-uid",
    });
  });

  it("returns 404 when reflection is owned by a different user", async () => {
    vi.mocked(getAdminFirestore).mockReturnValue({
      collection: () => ({
        doc: () => ({
          get: vi.fn(async () => ({
            exists: true,
            data: () => ({
              id: "reflection-1",
              uid: "someone-else",
              createdAt: 1,
              summary: "summary",
              traceIds: ["trace-1"],
            }),
          })),
        }),
      }),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    const response = await GET(
      new NextRequest("http://localhost/api/reflections/reflection-1"),
      { params: Promise.resolve({ reflectionId: "reflection-1" }) },
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toEqual({
      error: "Reflection not found",
    });
  });

  it("returns 401 when user is not authenticated", async () => {
    vi.mocked(authenticate).mockResolvedValue(null);

    const response = await GET(
      new NextRequest("http://localhost/api/reflections/reflection-1"),
      { params: Promise.resolve({ reflectionId: "reflection-1" }) },
    );

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({
      error: "Unauthorized",
    });
  });
});
