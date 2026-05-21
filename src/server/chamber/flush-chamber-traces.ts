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

  const summaryInputTraces = traces.filter((trace) => trace.liked !== false);

  // QA should generally lead reflection summaries; translation is supporting context.
  const summarySortedTraces = [...summaryInputTraces].sort((a, b) => {
    const aType = typeof a.type === "string" ? a.type.toLowerCase() : "";
    const bType = typeof b.type === "string" ? b.type.toLowerCase() : "";

    const aTypePriority = aType === "qa" ? 0 : aType === "translation" ? 1 : 2;
    const bTypePriority = bType === "qa" ? 0 : bType === "translation" ? 1 : 2;

    if (aTypePriority !== bTypePriority) {
      return aTypePriority - bTypePriority;
    }

    const aLikedPriority = a.liked === true ? 0 : 1;
    const bLikedPriority = b.liked === true ? 0 : 1;

    if (aLikedPriority !== bLikedPriority) {
      return aLikedPriority - bLikedPriority;
    }

    return 0;
  });

  const hasTranslationFocus =
    summaryInputTraces.length > 0 &&
    summaryInputTraces.every(
      (trace) =>
        typeof trace.type === "string" &&
        trace.type.toLowerCase() === "translation",
    );

  const summaryPrompt = [
    "You are writing a reflection recall note.",
    "Output exactly 1-2 short sentences, plain text only.",
    "Keep it compact and scannable: max 35 words total.",
    "Focus on what was learned, verified, or corrected.",
    "Do not use bullets, labels, or quotes.",
    hasTranslationFocus
      ? "This is a translation-focused reflection, so translation traces are primary."
      : "QA traces are primary; translation traces are supporting context only.",
    "",
    "Traces:",
    ...summarySortedTraces.map((trace, index) => {
      const type =
        typeof trace.type === "string" ? trace.type.toUpperCase() : "TRACE";
      const question = typeof trace.q === "string" ? trace.q : "";
      const answer = typeof trace.a === "string" ? trace.a : "";
      const liked = trace.liked === true ? "liked" : "neutral";

      if (type === "TRANSLATION") {
        const sourceLang =
          typeof trace.sourceLang === "string" ? trace.sourceLang : "unknown";
        const targetLang =
          typeof trace.targetLang === "string" ? trace.targetLang : "unknown";

        return `#${index + 1} [${type}] (${liked})\\nQ: Translate ${sourceLang} -> ${targetLang}: ${question}\\nA: ${answer}`;
      }

      return `#${index + 1} [${type}] (${liked})\\nQ: ${question}\\nA: ${answer}`;
    }),
  ].join("\n");

  let summary = "";
  let summaryGenerated = false;
  try {
    // Disliked traces do not participate in summarization.
    if (summaryInputTraces.length > 0) {
      summary = await fetchAnswer(summaryPrompt);
      summaryGenerated = true;
    }
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
