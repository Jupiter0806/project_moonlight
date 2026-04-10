import { NextResponse, type NextRequest } from "next/server";

const PUBLIC_PATHS = ["/login"];

/**
 * Decode a Firebase session cookie payload without verifying the signature.
 * Signature verification requires the Admin SDK (not available on Edge Runtime).
 * We rely on the server-side /api/auth/session endpoint to perform full
 * cryptographic verification at sign-in time.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const payloadB64 = token.split(".")[1];
    if (!payloadB64) return null;
    // base64url → base64 (restore padding)
    const base64 = payloadB64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(payloadB64.length + ((4 - (payloadB64.length % 4)) % 4), "=");
    return JSON.parse(atob(base64)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Let public routes and Next.js internals through
  if (
    PUBLIC_PATHS.some((p) => pathname.startsWith(p)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  const redirectToLogin = () => {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    const response = NextResponse.redirect(loginUrl);
    // Clear the invalid/expired cookie so the browser doesn't keep sending it
    response.cookies.delete("__session");
    return response;
  };

  const session = request.cookies.get("__session");
  if (!session?.value) {
    return redirectToLogin();
  }

  const payload = decodeJwtPayload(session.value);
  if (!payload) {
    return redirectToLogin();
  }

  // Reject expired tokens — prevents replayed or long-expired cookies from passing
  const exp = typeof payload.exp === "number" ? payload.exp : null;
  if (!exp || Math.floor(Date.now() / 1000) >= exp) {
    return redirectToLogin();
  }

  // Reject anything that isn't a Firebase session cookie for this project.
  // Firebase session cookies have iss = https://session.firebase.google.com/{projectId}
  // whereas raw ID tokens have iss = https://securetoken.google.com/{projectId}.
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const expectedIss = `https://session.firebase.google.com/${projectId}`;
  if (typeof payload.iss !== "string" || payload.iss !== expectedIss) {
    return redirectToLogin();
  }

  return NextResponse.next();
}

export const config = {
  // Run on all routes except static files
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
