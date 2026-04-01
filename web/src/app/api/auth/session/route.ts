import { type NextRequest, NextResponse } from "next/server";

/**
 * POST /api/auth/session
 *
 * Called by the client immediately after Firebase sign-in.
 * Body: { idToken: string }
 *
 * TODO
 * In a full implementation this would:
 *   1. Verify the idToken with Firebase Admin SDK
 *   2. Create a session cookie via admin.auth().createSessionCookie()
 *   3. Set it as an HttpOnly cookie
 *
 * For now it stores the raw ID token as the session value so the middleware
 * can detect an authenticated state. Replace with Admin SDK session cookies
 * before shipping to production.
 */
export async function POST(request: NextRequest) {
  const body = (await request.json()) as { idToken?: string };
  const idToken = body.idToken;

  if (!idToken) {
    return NextResponse.json({ error: "idToken is required" }, { status: 400 });
  }

  // TODO: verify idToken with Firebase Admin SDK and create a proper session cookie
  const response = NextResponse.json({ status: "ok" });
  response.cookies.set("__session", idToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Firebase ID tokens expire after 1 hour; keep cookie lifetime in sync
    maxAge: 60 * 60,
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
