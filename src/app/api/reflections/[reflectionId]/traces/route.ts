import { type NextRequest, NextResponse } from "next/server";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import {
  authenticate,
  parsePagination,
  withRateLimitHeaders,
} from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { listReflectionTraces } from "@/server/reflections/listReflectionTraces";

/**
 * GET /api/reflections/[reflectionId]/traces
 * Returns traces for a specific reflection with bidirectional cursor pagination.
 * - direction=top: fetch older traces before cursor
 * - direction=bottom: fetch newer traces after cursor
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ reflectionId: string }> },
) {
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

  const { reflectionId } = await params;

  const { direction, cursor, pageSize } = parsePagination(
    request.nextUrl.searchParams,
  );

  try {
    const response = await listReflectionTraces(getAdminFirestore(), {
      uid,
      reflectionId,
      direction,
      cursor,
      limit: pageSize,
    });
    return NextResponse.json(response);
  } catch (error) {
    console.error(
      `Failed to list traces for reflection ${reflectionId}`,
      error,
    );
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
