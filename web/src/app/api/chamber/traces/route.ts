import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  getTraceInUserChamber,
  isTranslationTrace,
  type UpsertChamberTraceBody,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";
import { listChamberTraces } from "@/server/chamber/listChamberTraces";
import { fetchAnswer } from "@/server/chamber/fetchAnswer";

function withRateLimitHeaders(limit: number, remaining: number, reset: number) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
    "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
  };
}

async function authenticate(request: NextRequest): Promise<string | null> {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    return decoded.uid;
  } catch {
    return null;
  }
}

/**
 * GET /api/chamber/traces
 * Returns chamber traces with bidirectional cursor pagination.
 * - direction=top: fetch older traces before cursor
 * - direction=bottom: fetch newer traces after cursor
 */
export async function GET(request: NextRequest) {
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

  const directionParam = request.nextUrl.searchParams.get("direction");
  const direction = directionParam === "top" ? "top" : "bottom";
  const cursor = request.nextUrl.searchParams.get("cursor") ?? undefined;
  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limitValue = Number.isFinite(rawLimit) ? rawLimit : 20;
  const pageSize = Math.max(1, Math.min(50, Math.trunc(limitValue)));

  try {
    const response = await listChamberTraces(getAdminFirestore(), {
      uid,
      direction,
      cursor,
      limit: pageSize,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to list chamber traces", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

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
        headers: withRateLimitHeaders(limit, remaining, reset),
      },
    );
  }

  const uid = await authenticate(request);
  if (!uid) {
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

  const db = getAdminFirestore();

  // Idempotency guard: if this trace already exists, return existing answer (for QA)
  // and avoid duplicate model calls / writes on retries.
  const existingTrace = await getTraceInUserChamber(db, uid, trace.id);
  if (existingTrace) {
    const existingResponse: {
      status: string;
      traceId: string;
      answer?: string;
    } = {
      status: "ok",
      traceId: existingTrace.id,
    };
    if (existingTrace.type === "qa" && existingTrace.a) {
      existingResponse.answer = existingTrace.a;
    }
    return NextResponse.json(existingResponse);
  }

  if (trace.type === "qa" && !trace.a) {
    try {
      trace.a = await fetchAnswer(trace.q);
    } catch (error) {
      console.error("Failed to fetch answer for QA trace", error);
      return NextResponse.json(
        { error: "Failed to fetch answer for QA trace" },
        { status: 500 },
      );
    }
  }

  try {
    await upsertTraceInUserChamber(db, uid, trace);
  } catch (error) {
    console.error("Failed to upsert chamber trace", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const response: { status: string; traceId: string; answer?: string } = {
    status: "ok",
    traceId: trace.id,
  };
  if (trace.type === "qa") {
    response.answer = trace.a;
  }

  return NextResponse.json(response);
}
