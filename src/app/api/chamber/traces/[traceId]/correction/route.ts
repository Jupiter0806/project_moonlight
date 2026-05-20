import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getRequestKey } from "@/lib/getRequestKey";
import { chamberTraceUpdatesRatelimit } from "@/lib/rateLimit";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import {
  getTraceInUserChamber,
  updateTranslationTraceCorrectionInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

interface UpdateCorrectionBody {
  correction?: unknown;
}

function normalizeCorrection(value: unknown): string | null {
  if (value === null) return null;
  if (typeof value !== "string") return null;

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
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

  const body = (await request.json()) as UpdateCorrectionBody;

  if (!(body.correction === null || typeof body.correction === "string")) {
    return NextResponse.json(
      { error: "Invalid correction payload" },
      { status: 400 },
    );
  }

  const correction = normalizeCorrection(body.correction);

  const { traceId } = await context.params;
  const db = getAdminFirestore();

  const existingTrace = await getTraceInUserChamber(db, uid, traceId);
  if (!existingTrace) {
    return NextResponse.json({ error: "Trace not found" }, { status: 404 });
  }

  if (existingTrace.type !== "translation") {
    return NextResponse.json(
      { error: "Trace is not a translation trace" },
      { status: 400 },
    );
  }

  try {
    await updateTranslationTraceCorrectionInUserChamber(
      db,
      uid,
      traceId,
      correction,
    );

    return NextResponse.json({
      status: "ok",
      traceId,
      correction,
    });
  } catch (error) {
    console.error("Failed to update translation correction", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
