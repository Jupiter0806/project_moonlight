import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getTraces } from "../services/traceService.js";
import type { AppVariables } from "../types/index.js";

export const tracesRouter = new Hono<{ Variables: AppVariables }>();

const getTracesQuery = z.object({
  user_id: z.string().min(1),
  reflection_id: z.string().min(1),
  counts: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

tracesRouter.get(
  "/traces",
  zValidator("query", getTracesQuery),
  async (ctx) => {
    const { reflection_id, counts, cursor } = ctx.req.valid("query");
    const userId = ctx.var.user.uid;

    const result = await getTraces(userId, reflection_id, counts, cursor);
    if (!result) {
      return ctx.json({ error: "Reflection not found or access denied" }, 404);
    }

    return ctx.json(result);
  },
);
