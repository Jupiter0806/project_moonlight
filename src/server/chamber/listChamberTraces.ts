import type { Firestore } from "firebase-admin/firestore";
import type { Trace } from "@/types/Trace";
import type { ListParams } from "../types/pagination.types";
import {
  buildPaginationQueryV2,
  buildPaginationCursorV2,
} from "../helpers/pagination-helpers-v2";
import { serializeFirestoreValue } from "@/server/helpers/firestore-serialization";
import type { URTEntry, TimelineApiResponse } from "@/store/types";

function mapEntry(trace: Trace): URTEntry {
  const displayType =
    trace.type === "translation"
      ? "translation-trace"
      : trace.type === "marginalia"
        ? "marginalia-trace"
        : "qa-trace";

  return {
    type: "trace",
    entryId: `entry-${trace.id}`,
    content: {
      id: trace.id,
      displayType,
    },
  };
}

export async function listChamberTraces(
  db: Firestore,
  params: ListParams,
): Promise<TimelineApiResponse> {
  const chamberTraceRef = db
    .collection("chambers")
    .doc(params.uid)
    .collection("traces");

  const query = buildPaginationQueryV2(chamberTraceRef, params, {
    bottomLatest: true,
  });

  const snapshot = await query.get();
  const rawTraces = snapshot.docs.map((doc) => doc.data() as Trace);
  const traces = rawTraces.map((trace) => serializeFirestoreValue(trace));

  const entries = traces.map(mapEntry);

  const { topCursor, bottomCursor, hasMoreTop, hasMoreBottom } =
    await buildPaginationCursorV2(chamberTraceRef, rawTraces, {
      bottomLatest: true,
    });

  return {
    entries,
    traces,
    // todo
    // requires timeline-specific response types (discriminated union)
    reflections: [],
    users: [],
    topCursor: topCursor ?? undefined,
    bottomCursor: bottomCursor ?? undefined,
    hasMoreTop,
    hasMoreBottom,
  };
}
