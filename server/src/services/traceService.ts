import { db } from "../config/firebase.js";
import { getReflectionForUser } from "./reflectionService.js";
import type { Trace, TraceDoc, PaginatedResponse } from "../types/index.js";

const TRACES = "traces";

function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf8");
}

function encodeCursor(docId: string): string {
  return Buffer.from(docId, "utf8").toString("base64url");
}

export async function getTraces(
  userId: string,
  reflectionId: string,
  counts: number,
  cursor?: string,
): Promise<PaginatedResponse<Trace> | null> {
  // Verify the reflection exists and belongs to the requesting user
  const reflection = await getReflectionForUser(reflectionId, userId);
  if (!reflection) return null;

  let query = db
    .collection(TRACES)
    .where("reflection_id", "==", reflectionId)
    .orderBy("created_time", "asc")
    .limit(counts + 1);

  if (cursor) {
    const docId = decodeCursor(cursor);
    const cursorDoc = await db.collection(TRACES).doc(docId).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > counts;
  const entries = docs.slice(0, counts).map((doc) => {
    const data = doc.data() as TraceDoc;
    return {
      id: data.id,
      created_time: data.created_time,
      q: data.q,
      a: data.a,
    } satisfies Trace;
  });

  const nextCursor =
    hasMore && docs[counts - 1] ? encodeCursor(docs[counts - 1].id) : "";

  return {
    pagination: { size: entries.length, cursor: nextCursor },
    entries,
  };
}

/**
 * Persists a single Q&A trace to Firestore and returns its generated ID.
 * Does NOT append to the reflection's trace_ids — callers must do that separately
 * (or use a batch if atomicity is required).
 */
export async function createTrace(
  userId: string,
  reflectionId: string,
  q: string,
  a: string,
): Promise<string> {
  const traceRef = db.collection(TRACES).doc();
  const traceDoc: TraceDoc = {
    id: traceRef.id,
    reflection_id: reflectionId,
    owner_id: userId,
    q,
    a,
    created_time: Date.now(),
  };
  await traceRef.set(traceDoc);
  return traceRef.id;
}
