import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceUpdatesRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import { listChamberTraces } from "@/server/chamber/listChamberTraces";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";

const DEFAULT_WAIT_MS = 8000;
const POLL_STEP_MS = 4000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * GET /api/chamber/updates
 * Returns only traces newer than the provided cursor.
 * This endpoint is intended for background polling (long-poll style).
 *
 * todo: implement SSE
 */
export async function GET(request: NextRequest) {
  const { success, limit, remaining, reset } =
    await chamberTraceUpdatesRatelimit.limit(await getRequestKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: withRateLimitHeaders(limit, remaining, reset),
      },
    );
  }

  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limitValue = Number.isFinite(rawLimit) ? rawLimit : 20;
  const pageSize = Math.max(1, Math.min(50, Math.trunc(limitValue)));
  const rawWait = Number(
    request.nextUrl.searchParams.get("waitMs") ?? DEFAULT_WAIT_MS,
  );
  const waitMs = Number.isFinite(rawWait)
    ? Math.max(1000, Math.min(15000, Math.trunc(rawWait)))
    : DEFAULT_WAIT_MS;

  try {
    const startedAt = Date.now();
    while (Date.now() - startedAt < waitMs) {
      const response = await listChamberTraces(getAdminFirestore(), {
        uid,
        direction: "bottom",
        cursor,
        limit: pageSize,
      });

      if (response.entries.length > 0) {
        return NextResponse.json({
          ...response,
          newReflectionsBar: {
            count: response.entries.length,
            instructions: [],
          },
        });
      }

      await sleep(POLL_STEP_MS);
    }

    return NextResponse.json({
      entries: [],
      traces: [],
      reflections: [],
      users: [],
      topCursor: cursor ?? null,
      bottomCursor: cursor ?? null,
      hasMoreTop: false,
      hasMoreBottom: false,
      newReflectionsBar: {
        count: 0,
        instructions: [],
      },
    });
  } catch (error) {
    console.error("Failed to list chamber updates", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
