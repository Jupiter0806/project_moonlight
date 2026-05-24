import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  FlushChamberTracesError,
  flushChamberTraces,
} from "@/server/chamber/flush-chamber-traces";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";

/**
 * POST /api/chamber/traces/flush
 * Flushes all traces in the authenticated user's chamber into root
 * `reflections` and `traces` collections.
 */
export async function POST(request: NextRequest) {
  const { success, limit, remaining, reset } =
    await chamberTraceRatelimit.limit(await getRequestKey(request));
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

  try {
    const result = await flushChamberTraces(
      getAdminFirestore(),
      uid,
      request.headers.get("x-user-timezone"),
    );
    return NextResponse.json({
      status: "ok",
      reflectionId: result.reflectionId,
      traceIds: result.traceIds,
      summary: result.summary,
      summaryGenerated: result.summaryGenerated,
    });
  } catch (error) {
    if (error instanceof FlushChamberTracesError) {
      if (error.code === "EMPTY_CHAMBER") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      if (error.code === "NO_VALID_TRACES") {
        return NextResponse.json({ error: error.message }, { status: 422 });
      }
    }

    console.error("Failed to flush chamber traces", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
