import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { getAnswer } from "../services/aiService.js";
import {
  createEmptyReflection,
  getReflectionForUser,
  appendTraceId,
} from "../services/reflectionService.js";
import { createTrace } from "../services/traceService.js";
import type { AppVariables } from "../types/index.js";

export const answerRouter = new Hono<{ Variables: AppVariables }>();

const answerQuery = z.object({
  user_id: z.string().min(1),
  reflection_id: z.string().optional(),
  question: z.string().min(1),
});

answerRouter.get("/answer", zValidator("query", answerQuery), async (ctx) => {
  const { reflection_id, question } = ctx.req.valid("query");
  const userId = ctx.var.user.uid;

  // Resolve or create a reflection session
  let resolvedReflectionId: string;
  if (reflection_id) {
    const existing = await getReflectionForUser(reflection_id, userId);
    if (!existing) {
      return ctx.json({ error: "Reflection not found or access denied" }, 404);
    }
    resolvedReflectionId = reflection_id;
  } else {
    // Auto-create a new reflection session; label will be updated by client or left generic
    resolvedReflectionId = await createEmptyReflection(
      userId,
      "New Reflection",
    );
  }

  // Get AI answer
  const answer = await getAnswer(question);

  // Persist the Q&A as a trace, then link it to the reflection
  const traceId = await createTrace(
    userId,
    resolvedReflectionId,
    question,
    answer,
  );
  await appendTraceId(resolvedReflectionId, traceId);

  return ctx.json({ reflection_id: resolvedReflectionId, question, answer });
});
