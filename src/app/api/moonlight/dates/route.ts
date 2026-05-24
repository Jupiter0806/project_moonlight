import { type NextRequest, NextResponse } from "next/server";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getRequestKey } from "@/lib/getRequestKey";
import { moonlightDatesRatelimit } from "@/lib/rateLimit";

import { listMoonlightHistoryDates } from "@/server/moonlight/listMoonlightHistoryDates";

export async function GET(request: NextRequest) {
  const { success, limit, remaining, reset } =
    await moonlightDatesRatelimit.limit(await getRequestKey(request));
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: withRateLimitHeaders(limit, remaining, reset),
      },
    );
  }

  const monthParam = request.nextUrl.searchParams.get("month");

  if (monthParam && !/^\d{4}-\d{2}$/.test(monthParam)) {
    return NextResponse.json({ error: "Invalid month" }, { status: 400 });
  }

  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await listMoonlightHistoryDates(
      getAdminFirestore(),
      uid,
      monthParam,
      request.headers.get("x-user-timezone"),
    );

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    console.error("Failed to load moonlight history dates", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
