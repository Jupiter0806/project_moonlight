import { type NextRequest, NextResponse } from "next/server";
import { moonlightRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  authenticate,
  parsePagination,
  withRateLimitHeaders,
} from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { listTodayReflections } from "@/server/reflections/listTodayReflections";

/**
 * GET /api/reflections/today
 * Returns reflections within today.
 * - direction=top: fetch older traces before cursor
 * - direction=bottom: fetch newer traces after cursor
 */
export async function GET(request: NextRequest) {
  const { success, limit, remaining, reset } = await moonlightRatelimit.limit(
    await getRequestKey(request),
  );
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
    const response = await listTodayReflections(getAdminFirestore(), {
      uid,
      direction,
      cursor,
      limit: pageSize,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error(`Failed to list today's reflections for user ${uid}`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
