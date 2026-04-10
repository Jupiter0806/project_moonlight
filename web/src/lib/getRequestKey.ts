import { type NextRequest } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";

/**
 * Returns a rate-limit key for the request.
 *
 * - Authenticated users: keyed by Firebase uid (stable across IPs, prevents
 *   abuse by rotating IPs).
 * - Guests: keyed by IP address (best-effort; may be shared on NAT/proxies but
 *   sufficient until a proper guest session is introduced).
 *
 * This never blocks — it is purely a key resolver for rate limiting.
 */
export async function getRequestKey(request: NextRequest): Promise<string> {
  const sessionCookie = request.cookies.get("__session")?.value;

  if (sessionCookie) {
    try {
      const decoded = await adminAuth.verifySessionCookie(sessionCookie);
      return `uid:${decoded.uid}`;
    } catch {
      // Invalid/expired cookie — fall through to IP-based key
    }
  }

  return getIpKey(request);
}

/**
 * Returns an IP-only rate-limit key.
 * Use this for pre-auth endpoints where no session cookie is present.
 */
export function getIpKey(request: NextRequest): string {
  // X-Forwarded-For is set by Vercel/proxies; fall back to a literal for local dev
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "127.0.0.1";
  return `ip:${ip}`;
}
