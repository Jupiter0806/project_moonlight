import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import {
  getReflections,
  createReflection,
} from "../services/reflectionService.js";
import type { AppVariables } from "../types/index.js";

export const reflectionsRouter = new Hono<{ Variables: AppVariables }>();

const getReflectionsQuery = z.object({
  user_id: z.string().min(1),
  counts: z.coerce.number().int().min(1).max(100).default(10),
  cursor: z.string().optional(),
});

const createReflectionBody = z.object({
  label: z.string().min(1),
  traces: z
    .array(
      z.object({
        q: z.string().min(1),
        a: z.string().min(1),
        created_time: z.number().int().positive(),
      }),
    )
    .default([]),
});

reflectionsRouter.get(
  "/reflections",
  zValidator("query", getReflectionsQuery),
  async (ctx) => {
    const { counts, cursor } = ctx.req.valid("query");
    const userId = ctx.var.user.uid;

    const result = await getReflections(userId, counts, cursor);
    return ctx.json(result);
  },
);

reflectionsRouter.post(
  "/reflection",
  zValidator("json", createReflectionBody),
  async (ctx) => {
    const body = ctx.req.valid("json");
    const userId = ctx.var.user.uid;

    const id = await createReflection(userId, body);
    return ctx.json({ id }, 201);
  },
);
