import { type NextRequest, NextResponse } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { getRequestKey } from "@/lib/getRequestKey";
import { qaRatelimit } from "@/lib/rateLimit";
import { authenticate, withRateLimitHeaders } from "@/lib/apis-helpers";
import { fetchAnswerStream } from "@/server/chamber/fetchAnswerStream";
import {
  getQaHistoryInUserChamber,
  getTraceInUserChamber,
  upsertTraceInUserChamber,
} from "@/server/chamber/upsertChamberTrace";

interface QaStreamEvent {
  type: "chunk" | "done" | "error";
  delta?: string;
  message?: string;
}

const encoder = new TextEncoder();

function encodeEvent(event: QaStreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ traceId: string }> },
) {
  const { success, limit, remaining, reset } = await qaRatelimit.limit(
    await getRequestKey(request),
  );

  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: withRateLimitHeaders(limit, remaining, reset),
      },
    );
  }

  const uid = await authenticate(request);
  if (!uid) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { traceId } = await context.params;
  const db = getAdminFirestore();

  const trace = await getTraceInUserChamber(db, uid, traceId);
  if (!trace) {
    return NextResponse.json({ error: "Trace not found" }, { status: 404 });
  }

  if (trace.type !== "qa") {
    return NextResponse.json(
      { error: "Trace is not a QA trace" },
      { status: 400 },
    );
  }

  const qaHistory = await getQaHistoryInUserChamber(db, uid, {
    excludeTraceId: trace.id,
    maxTurns: 12,
    scanLimit: 120,
  });

  // If answer is already completed, stream it back immediately for idempotent retries.
  if (trace.qaAnswerStatus === "completed" && trace.a) {
    const cachedStream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encodeEvent({ type: "chunk", delta: trace.a }));
        controller.enqueue(encodeEvent({ type: "done" }));
        controller.close();
      },
    });

    return new Response(cachedStream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
  }

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let answer = "";
      let aborted = false;

      request.signal.addEventListener("abort", () => {
        aborted = true;
      });

      try {
        for await (const delta of fetchAnswerStream(trace.q, qaHistory)) {
          if (aborted) {
            break;
          }

          answer += delta;
          controller.enqueue(encodeEvent({ type: "chunk", delta }));
        }

        if (!aborted) {
          if (!answer.trim()) {
            controller.enqueue(
              encodeEvent({
                type: "error",
                message: "Gemini returned an empty answer",
              }),
            );
            controller.close();
            return;
          }

          await upsertTraceInUserChamber(db, uid, {
            ...trace,
            a: answer,
            qaAnswerStatus: "completed",
          });

          controller.enqueue(encodeEvent({ type: "done" }));
        } else {
          await upsertTraceInUserChamber(db, uid, {
            ...trace,
            a: answer,
            qaAnswerStatus: "failed",
          });
        }
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Failed to stream answer for QA trace";
        await upsertTraceInUserChamber(db, uid, {
          ...trace,
          a: answer,
          qaAnswerStatus: "failed",
        });
        controller.enqueue(encodeEvent({ type: "error", message }));
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
    },
  });
}
