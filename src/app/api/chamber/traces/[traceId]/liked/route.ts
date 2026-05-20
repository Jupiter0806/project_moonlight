import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getRequestKey } from "@/lib/getRequestKey";
import { chamberTraceUpdatesRatelimit } from "@/lib/rateLimit";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import {
  getTraceInUserChamber,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

interface UpdateLikedBody {
  liked?: unknown;
}

function isValidLikedValue(value: unknown): value is boolean | null {
  return value === null || typeof value === "boolean";
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ traceId: string }> },
) {
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

  const body = (await request.json()) as UpdateLikedBody;

  if (!isValidLikedValue(body.liked)) {
    return NextResponse.json(
      { error: "Invalid liked payload" },
      { status: 400 },
    );
  }

  const { traceId } = await context.params;
  const db = getAdminFirestore();

  const existingTrace = await getTraceInUserChamber(db, uid, traceId);
  if (!existingTrace) {
    return NextResponse.json({ error: "Trace not found" }, { status: 404 });
  }

  try {
    await upsertTraceInUserChamber(db, uid, {
      ...existingTrace,
      liked: body.liked,
    });

    return NextResponse.json({
      status: "ok",
      traceId,
      liked: body.liked,
    });
  } catch (error) {
    console.error("Failed to update trace liked status", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
