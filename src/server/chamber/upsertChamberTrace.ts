import { FieldValue, type Firestore } from "firebase-admin/firestore";
import type { Trace } from "@/types/Trace";

export interface UpsertChamberTraceBody {
  trace?: unknown;
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
        user: uid,
        uid,
        chamberId: uid,
        syncedAt: FieldValue.serverTimestamp(),
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
  return doc.data() as Trace;
}
