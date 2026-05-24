import { type NextRequest, NextResponse } from "next/server";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getRequestKey } from "@/lib/getRequestKey";
import { moonlightDatesRatelimit } from "@/lib/rateLimit";
import {
  GenerateMoonlightHistoryError,
  generateMoonlightHistoryByDate,
  getMoonlightHistoryByDate,
} from "@/server/moonlight/listMoonlightHistoryDates";

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

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await getMoonlightHistoryByDate(
      getAdminFirestore(),
      uid,
      dateParam,
      request.headers.get("x-user-timezone"),
    );

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    console.error("Failed to load selected moonlight", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
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

  const dateParam = request.nextUrl.searchParams.get("date");
  if (!dateParam || !/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
    return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  }

  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await generateMoonlightHistoryByDate(
      getAdminFirestore(),
      uid,
      dateParam,
      request.headers.get("x-user-timezone"),
    );

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    if (error instanceof GenerateMoonlightHistoryError) {
      if (error.code === "NO_REFLECTIONS") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Failed to generate selected moonlight", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
