import { type NextRequest, NextResponse } from "next/server";
import { withRateLimitHeaders } from "@/lib/apis-helpers";
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

  const result = getMoonlightHistoryByDate(dateParam);

  return NextResponse.json({
    status: "ok",
    ...result,
  });
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

  try {
    const result = generateMoonlightHistoryByDate(dateParam);

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

    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
