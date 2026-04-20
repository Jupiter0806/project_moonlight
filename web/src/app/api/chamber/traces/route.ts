import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  isTranslationTrace,
  type UpsertChamberTraceBody,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

/**
 * POST /api/chamber/traces
 * Upserts one translation trace into the authenticated user's private chamber.
 */
export async function POST(request: NextRequest) {
  const { success, limit, remaining, reset } =
    await chamberTraceRatelimit.limit(await getRequestKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  const sessionCookie = request.cookies.get("__session")?.value;

  if (!sessionCookie) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let uid: string;
  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as UpsertChamberTraceBody;

  if (!isTranslationTrace(body.trace)) {
    return NextResponse.json(
      { error: "Invalid trace payload" },
      { status: 400 },
    );
  }

  const trace = body.trace;

  if (trace.user !== uid) {
    return NextResponse.json(
      { error: "Forbidden: trace owner mismatch" },
      { status: 403 },
    );
  }

  try {
    await upsertTraceInUserChamber(getAdminFirestore(), uid, trace);
  } catch (error) {
    console.error("Failed to upsert chamber trace", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  return NextResponse.json({ status: "ok", traceId: trace.id });
}
