import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { Trace } from "@/types/Trace";
import {
  millisToFirestoreTimestamp,
  serializeFirestoreValue,
} from "@/server/helpers/firestore-serialization";

export interface UpsertChamberTraceBody {
  trace?: unknown;
}

function isLikedValue(value: unknown): value is boolean | null {
  return value === null || typeof value === "boolean";
}

function isQaAnswerStatus(value: unknown): boolean {
  return value === "pending" || value === "completed" || value === "failed";
}

export function isTranslationTrace(value: unknown): value is Trace {
  if (!value || typeof value !== "object") return false;

  const trace = value as Record<string, unknown>;
  if (trace.type === "translation")
    return (
      typeof trace.id === "string" &&
      typeof trace.createdAt === "number" &&
      typeof trace.q === "string" &&
      typeof trace.a === "string" &&
      typeof trace.user === "string" &&
      typeof trace.reflection === "string" &&
      (trace.liked === undefined || isLikedValue(trace.liked)) &&
      trace.type === "translation" &&
      typeof trace.sourceLang === "string" &&
      typeof trace.targetLang === "string"
    );

  return (
    typeof trace.id === "string" &&
    typeof trace.createdAt === "number" &&
    typeof trace.q === "string" &&
    typeof trace.a === "string" &&
    typeof trace.user === "string" &&
    typeof trace.reflection === "string" &&
    (trace.liked === undefined || isLikedValue(trace.liked)) &&
    (trace.qaAnswerStatus === undefined ||
      isQaAnswerStatus(trace.qaAnswerStatus)) &&
    trace.type === "qa"
  );
}

export async function upsertTraceInUserChamber(
  db: Firestore,
  uid: string,
  trace: Trace,
): Promise<void> {
  const chamberRef = db.collection("chambers").doc(uid);

  await chamberRef.set(
    {
      ownerUserId: uid,
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  await chamberRef
    .collection("traces")
    .doc(trace.id)
    .set(
      {
        ...trace,
        liked: trace.liked ?? null,
        user: uid,
        uid,
        chamberId: uid,
        syncedAt: FieldValue.serverTimestamp(),
        createdAt: millisToFirestoreTimestamp(trace.createdAt, "createdAt"),
      },
      { merge: true },
    );
}

export async function getTraceInUserChamber(
  db: Firestore,
  uid: string,
  traceId: string,
): Promise<Trace | null> {
  const doc = await db
    .collection("chambers")
    .doc(uid)
    .collection("traces")
    .doc(traceId)
    .get();

  if (!doc.exists) return null;
  return serializeFirestoreValue(doc.data() as Trace);
}

export interface QaHistoryMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function getQaHistoryInUserChamber(
  db: Firestore,
  uid: string,
  options?: {
    excludeTraceId?: string;
    maxTurns?: number;
    scanLimit?: number;
  },
): Promise<QaHistoryMessage[]> {
  const maxTurns = options?.maxTurns ?? 12;
  const scanLimit = options?.scanLimit ?? 80;

  const snapshot = await db
    .collection("chambers")
    .doc(uid)
    .collection("traces")
    .orderBy("createdAt", "desc")
    .limit(Math.max(scanLimit, maxTurns))
    .get();

  const traces = snapshot.docs
    .map((doc) => serializeFirestoreValue(doc.data() as Trace))
    .filter(
      (trace) =>
        trace.type === "qa" &&
        trace.id !== options?.excludeTraceId &&
        trace.qaAnswerStatus !== "failed" &&
        Boolean(trace.q?.trim()) &&
        Boolean(trace.a?.trim()),
    )
    .slice(0, maxTurns)
    .reverse();

  const history: QaHistoryMessage[] = [];
  for (const trace of traces) {
    history.push({ role: "user", parts: [{ text: trace.q }] });
    history.push({ role: "model", parts: [{ text: trace.a }] });
  }

  return history;
}
