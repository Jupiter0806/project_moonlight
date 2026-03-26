import { db } from "../config/firebase.js";
import type {
  Reflection,
  ReflectionDoc,
  PaginatedResponse,
  CreateReflectionInput,
  TraceDoc,
} from "../types/index.js";

const REFLECTIONS = "reflections";
const TRACES = "traces";

/** Decodes a base64 opaque cursor back to a Firestore document ID. */
function decodeCursor(cursor: string): string {
  return Buffer.from(cursor, "base64url").toString("utf8");
}

/** Encodes a Firestore document ID into an opaque base64 cursor. */
function encodeCursor(docId: string): string {
  return Buffer.from(docId, "utf8").toString("base64url");
}

export async function getReflections(
  userId: string,
  counts: number,
  cursor?: string,
): Promise<PaginatedResponse<Reflection>> {
  let query = db
    .collection(REFLECTIONS)
    .where("owner_id", "==", userId)
    .orderBy("created_at", "desc")
    .limit(counts + 1); // fetch one extra to detect if there's a next page

  if (cursor) {
    const docId = decodeCursor(cursor);
    const cursorDoc = await db.collection(REFLECTIONS).doc(docId).get();
    if (cursorDoc.exists) {
      query = query.startAfter(cursorDoc);
    }
  }

  const snapshot = await query.get();
  const docs = snapshot.docs;

  const hasMore = docs.length > counts;
  const entries = docs.slice(0, counts).map((doc) => {
    const data = doc.data() as ReflectionDoc;
    return {
      id: data.id,
      label: data.label,
      owner_id: data.owner_id,
      trace_ids: data.trace_ids,
    } satisfies Reflection;
  });

  const lastDoc = docs[counts - 1];
  const nextCursor = hasMore && lastDoc ? encodeCursor(lastDoc.id) : "";

  return {
    pagination: { size: entries.length, cursor: nextCursor },
    entries,
  };
}

export async function createReflection(
  userId: string,
  input: CreateReflectionInput,
): Promise<string> {
  const reflectionRef = db.collection(REFLECTIONS).doc();
  const reflectionId = reflectionRef.id;
  const now = Date.now();

  const traceRefs = input.traces.map(() => db.collection(TRACES).doc());
  const traceIds = traceRefs.map((ref) => ref.id);

  const batch = db.batch();

  const reflectionDoc: ReflectionDoc = {
    id: reflectionId,
    label: input.label,
    owner_id: userId,
    trace_ids: traceIds,
    created_at: now,
  };
  batch.set(reflectionRef, reflectionDoc);

  input.traces.forEach((trace, i) => {
    const traceId = traceIds[i];
    const traceRef = traceRefs[i];
    if (!traceId || !traceRef) return;
    const traceDoc: TraceDoc = {
      id: traceId,
      reflection_id: reflectionId,
      owner_id: userId,
      q: trace.q,
      a: trace.a,
      created_time: trace.created_time,
    };
    batch.set(traceRef, traceDoc);
  });

  await batch.commit();
  return reflectionId;
}

/**
 * Creates a new empty reflection (no traces) — used by the /answer endpoint
 * when no reflection_id is provided by the client.
 */
export async function createEmptyReflection(
  userId: string,
  label: string,
): Promise<string> {
  return createReflection(userId, { label, traces: [] });
}

/**
 * Appends a trace ID to an existing reflection's trace_ids array.
 * Uses FieldValue.arrayUnion for safe concurrent updates.
 */
export async function appendTraceId(
  reflectionId: string,
  traceId: string,
): Promise<void> {
  const { FieldValue } = await import("firebase-admin/firestore");
  await db
    .collection(REFLECTIONS)
    .doc(reflectionId)
    .update({ trace_ids: FieldValue.arrayUnion(traceId) });
}

/**
 * Fetches a single reflection and verifies it belongs to the given user.
 * Returns null if not found or not owned by the user.
 */
export async function getReflectionForUser(
  reflectionId: string,
  userId: string,
): Promise<ReflectionDoc | null> {
  const doc = await db.collection(REFLECTIONS).doc(reflectionId).get();
  if (!doc.exists) return null;
  const data = doc.data() as ReflectionDoc;
  if (data.owner_id !== userId) return null;
  return data;
}
