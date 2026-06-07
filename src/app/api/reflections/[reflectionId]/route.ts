import { type NextRequest, NextResponse } from "next/server";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { serializeFirestoreValue } from "@/server/helpers/firestore-serialization";
import type { Reflection } from "@/types/Reflection";

/**
 * GET /api/reflections/[reflectionId]
 * Returns a single reflection owned by the authenticated user.
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

  try {
    const snapshot = await getAdminFirestore()
      .collection("reflections")
      .doc(reflectionId)
      .get();

    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Reflection not found" },
        { status: 404 },
      );
    }

    const reflection = serializeFirestoreValue(snapshot.data() as Reflection);

    if (reflection.uid !== uid) {
      return NextResponse.json(
        { error: "Reflection not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(reflection);
  } catch (error) {
    console.error(`Failed to fetch reflection ${reflectionId}`, error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
