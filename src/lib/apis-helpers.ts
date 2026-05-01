import "server-only";

import { NextRequest } from "next/server";
import { getAdminAuth } from "./firebaseAdmin";

export function parsePagination(query: URLSearchParams) {
  const directionParam = query.get("direction");
  const direction =
    directionParam === "top" ? ("top" as const) : ("bottom" as const);
  const cursor = query.get("cursor") ?? undefined;
  const rawLimit = Number(query.get("limit") ?? 20);
  const limitValue = Number.isFinite(rawLimit) ? rawLimit : 20;
  const pageSize = Math.max(1, Math.min(50, Math.trunc(limitValue)));

  return { direction, cursor, pageSize };
}

export function withRateLimitHeaders(
  limit: number,
  remaining: number,
  reset: number,
) {
  return {
    "X-RateLimit-Limit": String(limit),
    "X-RateLimit-Remaining": String(remaining),
    "X-RateLimit-Reset": String(reset),
    "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
  };
}

export async function authenticate(
  request: NextRequest,
): Promise<string | null> {
  const sessionCookie = request.cookies.get("__session")?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie);
    return decoded.uid;
  } catch {
    return null;
  }
}
