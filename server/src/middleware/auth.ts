import type { MiddlewareHandler } from "hono";
import { auth } from "../config/firebase.js";
import type { AppVariables } from "../types/index.js";

/**
 * Verifies the `Authorization: Bearer <id-token>` header using Firebase Auth.
 * On success, attaches the decoded token to `ctx.var.user`.
 * Returns 401 if the header is missing or the token is invalid/expired.
 */
export const requireAuth: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (ctx, next) => {
  const authHeader = ctx.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return ctx.json(
      { error: "Missing or malformed Authorization header" },
      401,
    );
  }

  const token = authHeader.slice("Bearer ".length);

  try {
    const decoded = await auth.verifyIdToken(token);
    ctx.set("user", decoded);
  } catch {
    return ctx.json({ error: "Invalid or expired token" }, 401);
  }

  await next();
};

/**
 * Validates that the `user_id` query parameter matches the authenticated user's UID.
 * Must be used after `requireAuth`.
 * Returns 403 on mismatch.
 */
export const requireMatchingUserId: MiddlewareHandler<{
  Variables: AppVariables;
}> = async (ctx, next) => {
  const queryUserId = ctx.req.query("user_id");
  const tokenUid = ctx.var.user.uid;

  if (queryUserId !== undefined && queryUserId !== tokenUid) {
    return ctx.json(
      { error: "Forbidden: user_id does not match authenticated user" },
      403,
    );
  }

  await next();
};
