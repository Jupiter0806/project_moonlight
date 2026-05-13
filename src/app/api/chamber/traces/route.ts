import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { chamberTraceRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  getTraceInUserChamber,
  isTranslationTrace as isTrace,
  type UpsertChamberTraceBody,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";
import { listChamberTraces } from "@/server/chamber/listChamberTraces";
import {
  authenticate,
  parsePagination,
  withRateLimitHeaders,
} from "@/lib/apis-helpers";
import { buildCursor } from "@/server/helpers/pagination-helpers-v2";
import { QATrace } from "@/types/Trace";

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

  const { direction, cursor, pageSize } = parsePagination(
    request.nextUrl.searchParams,
  );

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
 * Upserts one trace (translation or QA) into the authenticated user's private chamber.
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

  if (!isTrace(body.trace)) {
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
      qaAnswerStatus?: QATrace["qaAnswerStatus"];
    } = {
      status: "ok",
      traceId: existingTrace.id,
    };
    if (existingTrace.type === "qa" && existingTrace.a) {
      existingResponse.answer = existingTrace.a;
    }
    if (existingTrace.type === "qa") {
      existingResponse.qaAnswerStatus = existingTrace.qaAnswerStatus;
    }
    return NextResponse.json(existingResponse);
  }

  if (trace.type === "qa") {
    trace.qaAnswerStatus = trace.a.trim() ? "completed" : "pending";
  }

  try {
    await upsertTraceInUserChamber(db, uid, trace);
  } catch (error) {
    console.error("Failed to upsert chamber trace", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const response: {
    status: string;
    traceId: string;
    answer?: string;
    qaAnswerStatus?: QATrace["qaAnswerStatus"];
    cursor: string;
  } = {
    status: "ok",
    traceId: trace.id,
    cursor: buildCursor(trace),
  };
  if (trace.type === "qa") {
    response.answer = trace.a;
    response.qaAnswerStatus = trace.qaAnswerStatus;
  }

  return NextResponse.json(response);
}
