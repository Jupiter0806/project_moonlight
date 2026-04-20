import type { Firestore } from "firebase-admin/firestore";
import type {
  TimelineApiResponse,
  URTEntry,
} from "@/store/thunks/fetchTimelineThunk";
import type { TranslationTrace } from "@/types/Trace";

export interface TraceCursor {
  createdAt: number;
  id: string;
}

export interface ListChamberTracesParams {
  uid: string;
  direction: "top" | "bottom";
  cursor?: string;
  limit: number;
}

function encodeCursor(cursor: TraceCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): TraceCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<TraceCursor>;

    if (
      typeof parsed.createdAt !== "number" ||
      !Number.isFinite(parsed.createdAt) ||
      typeof parsed.id !== "string" ||
      !parsed.id
    ) {
      return null;
    }

    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
    return null;
  }
}

function mapEntry(trace: TranslationTrace): URTEntry {
  return {
    type: "trace",
    entryId: `entry-${trace.id}`,
    content: {
      id: trace.id,
      displayType:
        trace.type === "translation" ? "translation-trace" : "qa-trace",
    },
  };
}

export async function listChamberTraces(
  db: Firestore,
  params: ListChamberTracesParams,
): Promise<TimelineApiResponse> {
  const chamberTraceRef = db
    .collection("chambers")
    .doc(params.uid)
    .collection("traces");

  const baseQuery = chamberTraceRef
    .orderBy("createdAt", "asc")
    .orderBy("id", "asc");

  const decodedCursor = params.cursor ? decodeCursor(params.cursor) : null;

  let query = baseQuery;
  if (decodedCursor) {
    if (params.direction === "top") {
      query = baseQuery
        .endBefore(decodedCursor.createdAt, decodedCursor.id)
        .limitToLast(params.limit);
    } else {
      query = baseQuery
        .startAfter(decodedCursor.createdAt, decodedCursor.id)
        .limit(params.limit);
    }
  } else if (params.direction === "bottom") {
    // Initial fetch returns the latest N traces while preserving ascending order.
    query = baseQuery.limitToLast(params.limit);
  } else {
    query = baseQuery.limitToLast(params.limit);
  }

  const snapshot = await query.get();
  const traces = snapshot.docs.map((doc) => doc.data() as TranslationTrace);

  const entries = traces.map(mapEntry);

  if (traces.length === 0) {
    return {
      entries,
      traces,
      reflections: [],
      users: [],
    };
  }

  const first = traces[0];
  const last = traces[traces.length - 1];

  const olderCheck = await baseQuery
    .endBefore(first.createdAt, first.id)
    .limitToLast(1)
    .get();
  const newerCheck = await baseQuery
    .startAfter(last.createdAt, last.id)
    .limit(1)
    .get();

  return {
    entries,
    traces,
    // todo
    // requires timeline-specific response types (discriminated union)
    reflections: [],
    users: [],
    topCursor: olderCheck.empty
      ? undefined
      : encodeCursor({ createdAt: first.createdAt, id: first.id }),
    bottomCursor: newerCheck.empty
      ? undefined
      : encodeCursor({ createdAt: last.createdAt, id: last.id }),
  };
}
