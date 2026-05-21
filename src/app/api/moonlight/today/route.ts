import { type NextRequest, NextResponse } from "next/server";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { getRequestKey } from "@/lib/getRequestKey";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import {
  GenerateTodayMoonlightError,
  generateTodayMoonlight,
  getTodayMoonlight,
} from "@/server/moonlight/generateTodayMoonlight";

/**
 * GET /api/moonlight/today
 * Checks whether today's Moonlight summary exists for the authenticated user.
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

  try {
    const result = await getTodayMoonlight(
      getAdminFirestore(),
      uid,
      request.headers.get("x-user-timezone"),
    );

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    console.error("Failed to load today's moonlight", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

/**
 * POST /api/moonlight/today
 * Generates today's Moonlight summary and persists it. If it already exists,
 * regeneration is only allowed when new reflections were added today.
 */
export async function POST(request: NextRequest) {
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

  try {
    const result = await generateTodayMoonlight(
      getAdminFirestore(),
      uid,
      request.headers.get("x-user-timezone"),
    );

    return NextResponse.json({
      status: "ok",
      ...result,
    });
  } catch (error) {
    if (error instanceof GenerateTodayMoonlightError) {
      if (error.code === "NO_REFLECTIONS") {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }
    }

    console.error("Failed to generate today's moonlight", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
