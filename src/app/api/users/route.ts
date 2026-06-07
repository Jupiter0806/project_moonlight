import { type NextRequest, NextResponse } from "next/server";
import { usersRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { fetchUsers } from "@/server/users/fetchUsers";

const MAX_USER_IDS_PER_REQUEST = 50;

/**
 * GET /api/users
 * Returns requested users.
 *
 * Query params:
 *    userIds       — Comma-separated list of user IDs to fetch. If omitted, returns empty.
 */
export async function GET(request: NextRequest) {
  const { success, limit, remaining, reset } = await usersRatelimit.limit(
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

  const userIds = [
    ...new Set(
      (request.nextUrl.searchParams.get("userIds")?.split(",") ?? [])
        .map((id) => id.trim())
        .filter(Boolean),
    ),
  ];

  if (userIds.length > MAX_USER_IDS_PER_REQUEST) {
    return NextResponse.json(
      {
        error: `Too many userIds. Maximum is ${MAX_USER_IDS_PER_REQUEST}.`,
      },
      { status: 400 },
    );
  }

  try {
    const response = await fetchUsers(getAdminFirestore(), userIds);
    return NextResponse.json(response);
  } catch (error) {
    console.error("Failed to fetch users", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
