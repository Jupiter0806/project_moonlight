import { Hono } from "hono";
import { cors } from "hono/cors";
import { requireAuth, requireMatchingUserId } from "./middleware/auth.js";
import { reflectionsRouter } from "./routes/reflections.js";
import { tracesRouter } from "./routes/traces.js";
import { answerRouter } from "./routes/answer.js";
import type { AppVariables } from "./types/index.js";

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGIN ?? "http://localhost:3000",
      allowHeaders: ["Authorization", "Content-Type"],
      allowMethods: ["GET", "POST", "OPTIONS"],
    }),
  );

  app.get("/health", (ctx) => ctx.json({ status: "ok" }));

  // All API routes require authentication + matching user_id
  app.use("/api/*", requireAuth, requireMatchingUserId);

  app.route("/api", reflectionsRouter);
  app.route("/api", tracesRouter);
  app.route("/api", answerRouter);

  app.notFound((ctx) => ctx.json({ error: "Not found" }, 404));

  app.onError((err, ctx) => {
    console.error(err);
    return ctx.json({ error: "Internal server error" }, 500);
  });

  return app;
}
