import { type NextRequest, NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { authRatelimit } from "@/lib/rateLimit";
import { getIpKey } from "@/lib/getRequestKey";

// 5 days — maximum allowed by Firebase for session cookies
const SESSION_MAX_AGE = 60 * 60 * 24 * 5;

/**
 * POST /api/auth/session
 *
 * Called by the client immediately after Firebase sign-in.
 * Body: { idToken: string }
 *
 * 1. Verifies the Firebase ID token with the Admin SDK (server-side, cryptographic check)
 * 2. Mints a long-lived Firebase session cookie (up to 5 days)
 * 3. Sets it as an HttpOnly cookie so JS on the client can never read it
 */
export async function POST(request: NextRequest) {
  const { success, limit, remaining, reset } = await authRatelimit.limit(
    getIpKey(request),
  );
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

  const body = (await request.json()) as { idToken?: string };
  const idToken = body.idToken;

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  let sessionCookie: string;
  try {
    // Verify the ID token first — rejects tampered/expired tokens
    await getAdminAuth().verifyIdToken(idToken);
    // Mint a proper session cookie valid for SESSION_MAX_AGE seconds
    sessionCookie = await getAdminAuth().createSessionCookie(idToken, {
      expiresIn: SESSION_MAX_AGE * 1000, // Firebase expects milliseconds
    });
  } catch (error) {
    console.debug("error", error);
    return NextResponse.json({ error: "Invalid ID token" }, { status: 401 });
  }

  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("__session", sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });

  return response;
}

/**
 * DELETE /api/auth/session
 * Clears the session cookie (sign-out).
 */
export async function DELETE() {
  const response = NextResponse.json({ status: "ok" });
  response.cookies.delete("__session");
  return response;
}
