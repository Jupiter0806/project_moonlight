import { type NextRequest, NextResponse } from "next/server";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  authenticate,
  parsePagination,
  withRateLimitHeaders,
} from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { listReflections } from "@/server/reflections/listReflections";

/**
 * GET /api/reflections
 * Returns reflections with bidirectional cursor pagination.
 * - direction=top: fetch older reflections before cursor
 * - direction=bottom: fetch newer reflections after cursor
 */
export async function GET(request: NextRequest) {
  const { success, limit, remaining, reset } = await reflectionsRatelimit.limit(
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
    const response = await listReflections(getAdminFirestore(), {
      uid,
      direction,
      cursor,
      limit: pageSize,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to list reflections", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
