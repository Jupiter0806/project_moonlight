import { type NextRequest } from "next/server";
import { getAdminFirestore } from "@/lib/firebaseAdmin";
import { reflectionsRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";
import { authenticate } from "@/lib/apis-helpers";
import { listReflections } from "@/server/reflections/listReflections";
import { buildInstruction } from "@/lib/urt-instrucation-helpers";
import { encodeCursor } from "@/server/helpers/pagination-helpers";
import type { Reflection } from "@/types/Reflection";

const POLL_STEP_MS = 4000;

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildCursorFromReflection(reflection: Reflection | undefined) {
  if (!reflection) return undefined;

  const createdAtMs = Number(reflection.createdAt);
  if (!Number.isFinite(createdAtMs)) return undefined;

  const seconds = Math.floor(createdAtMs / 1000);
  const nanoseconds = Math.floor((createdAtMs - seconds * 1000) * 1_000_000);

  return encodeCursor({
    createdAt: {
      _seconds: seconds,
      _nanoseconds: nanoseconds,
    },
    id: reflection.id,
  });
}

/**
 * GET /api/reflections/updates
 * Streams incremental camphor reflections updates as SSE.
 * New reflections are surfaced via newReflectionsBar instructions
 * and are applied to the timeline only when the user clicks the bar.
 */
export async function GET(request: NextRequest) {
  const { success } = await reflectionsRatelimit.limit(
    await getRequestKey(request),
  );
  if (!success) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429,
      headers: { "Content-Type": "application/json" },
    });
  }

  const uid = await authenticate(request);
  if (!uid) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawLimit = Number(request.nextUrl.searchParams.get("limit") ?? 20);
  const limitValue = Number.isFinite(rawLimit) ? rawLimit : 20;
  const pageSize = Math.max(1, Math.min(50, Math.trunc(limitValue)));

  let updatesCursor = request.nextUrl.searchParams.get("cursor") ?? undefined;

  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder();
      let active = true;

      const writeEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      const run = async () => {
        try {
          writeEvent("ready", { ok: true });

          while (active && !request.signal.aborted) {
            if (!updatesCursor) {
              // Client has no cursor — their list was empty at load time.
              // Fetch the latest page so we can anchor the poll boundary AND
              // emit any reflections that appeared before the SSE connection
              // was established (they are "new" to this client).
              const latestResponse = await listReflections(
                getAdminFirestore(),
                {
                  uid,
                  direction: "bottom",
                  limit: pageSize,
                },
              );

              updatesCursor = buildCursorFromReflection(
                latestResponse.reflections[0],
              );

              if (latestResponse.entries.length > 0) {
                writeEvent("updates", {
                  ...latestResponse,
                  nextCursor: updatesCursor,
                  newReflectionsBar: {
                    count: latestResponse.entries.length,
                    instructions: [
                      buildInstruction("add-entries", {
                        entries: latestResponse.entries,
                      }),
                    ],
                  },
                });
              }

              await sleep(POLL_STEP_MS);
              continue;
            }

            const response = await listReflections(getAdminFirestore(), {
              uid,
              direction: "top",
              cursor: updatesCursor,
              limit: pageSize,
            });

            if (response.entries.length > 0) {
              const nextCursor = buildCursorFromReflection(
                response.reflections[0],
              );
              if (nextCursor) {
                updatesCursor = nextCursor;
              }

              writeEvent("updates", {
                ...response,
                nextCursor,
                newReflectionsBar: {
                  count: response.entries.length,
                  instructions: [
                    buildInstruction("add-entries", {
                      entries: response.entries,
                    }),
                  ],
                },
              });
            } else {
              writeEvent("ping", { ts: Date.now() });
            }

            await sleep(POLL_STEP_MS);
          }
        } catch (error) {
          if (!request.signal.aborted) {
            console.error("Failed to stream reflection updates", error);
          }
        } finally {
          if (active) {
            active = false;
            controller.close();
          }
        }
      };

      void run();

      request.signal.addEventListener("abort", () => {
        if (!active) return;
        active = false;
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
