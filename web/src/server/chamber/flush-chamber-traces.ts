import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { fetchAnswer } from "@/server/chamber/fetchAnswer";

export class FlushChamberTracesError extends Error {
  constructor(
    public readonly code: "EMPTY_CHAMBER" | "NO_VALID_TRACES",
    message: string,
  ) {
    super(message);
    this.name = "FlushChamberTracesError";
  }
}

export interface FlushChamberTracesResult {
  reflectionId: string;
  traceIds: string[];
  summary: string;
  summaryGenerated: boolean;
}

/**
 * Flushes all traces in a user's chamber, create a new reflection,
 * and push all traces into Traces collection.
 *
 * New reflection will has a traces field with an array of trace IDs,
 * and each trace will have a reflectionId field pointing to the reflection.
 * @param db Firestore instance
 * @param uid User ID
 */

export async function flushChamberTraces(
  db: Firestore,
  uid: string,
): Promise<FlushChamberTracesResult> {
  const chamberRef = db.collection("chambers").doc(uid);
  const tracesSnapshot = await chamberRef.collection("traces").get();

  if (tracesSnapshot.empty) {
    throw new FlushChamberTracesError(
      "EMPTY_CHAMBER",
      "No traces found in chamber",
    );
  }

  const traces = tracesSnapshot.docs
    .map((doc) => doc.data() as Record<string, unknown>)
    .filter(
      (trace): trace is Record<string, unknown> & { id: string } =>
        typeof trace.id === "string",
    );

  const traceIds = traces.map((trace) => trace.id);

  if (traceIds.length === 0) {
    throw new FlushChamberTracesError(
      "NO_VALID_TRACES",
      "No valid traces found in chamber",
    );
  }

  const summaryPrompt = [
    "Summarize this reflection based on the traces below in 2-4 concise sentences.",
    "Highlight key themes, intent, and outcomes.",
    "",
    ...traces.map((trace, index) => {
      const type =
        typeof trace.type === "string" ? trace.type.toUpperCase() : "TRACE";
      const question = typeof trace.q === "string" ? trace.q : "";
      const answer = typeof trace.a === "string" ? trace.a : "";

      if (type === "TRANSLATION") {
        const sourceLang =
          typeof trace.sourceLang === "string" ? trace.sourceLang : "unknown";
        const targetLang =
          typeof trace.targetLang === "string" ? trace.targetLang : "unknown";

        return `#${index + 1} [${type}]\\nQ: Translate from ${sourceLang} to ${targetLang}: ${question}\\nA: ${answer}`;
      }

      return `#${index + 1} [${type}]\\nQ: ${question}\\nA: ${answer}`;
    }),
  ].join("\n");

  let summary = "";
  let summaryGenerated = false;
  try {
    summary = await fetchAnswer(summaryPrompt);
    summaryGenerated = true;
  } catch (error) {
    // Summary generation is best-effort. Flush should still succeed without it.
    console.error("Failed to generate reflection summary", error);
  }

  const batch = db.batch();

  // 1. create a new reflection
  const reflectionRef = db.collection("reflections").doc();
  batch.set(
    reflectionRef,
    {
      id: reflectionRef.id,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      uid,
      traceIds,
      summary,
    },
    { merge: true },
  );

  // 2. push traces from chamber into root traces collection.
  traces.forEach((trace) => {
    const traceRef = db.collection("traces").doc(trace.id);
    batch.set(
      traceRef,
      {
        ...trace,
        uid,
        reflection: reflectionRef.id,
        reflectionId: reflectionRef.id,
        syncedAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  });

  // 3. delete all traces in the chamber
  tracesSnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();

  return {
    reflectionId: reflectionRef.id,
    traceIds,
    summary,
    summaryGenerated,
  };
}
