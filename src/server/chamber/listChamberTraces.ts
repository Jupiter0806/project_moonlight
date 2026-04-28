import type { Firestore } from "firebase-admin/firestore";
import type {
  TimelineApiResponse,
  URTEntry,
} from "@/store/thunks/fetchTimelineThunk";
import type { Trace } from "@/types/Trace";
import type { ListParams } from "../types/pagination.types";
import {
  buildPaginationCursor,
  buildPaginationQuery,
} from "../helpers/pagination-helpers";

function mapEntry(trace: Trace): URTEntry {
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
  params: ListParams,
): Promise<TimelineApiResponse> {
  const chamberTraceRef = db
    .collection("chambers")
    .doc(params.uid)
    .collection("traces");

  const query = buildPaginationQuery(chamberTraceRef, params, {
    bottomLatest: true,
  });

  const snapshot = await query.get();
  const traces = snapshot.docs.map((doc) => doc.data() as Trace);

  const entries = traces.map(mapEntry);

  if (traces.length === 0) {
    return {
      entries,
      traces,
      reflections: [],
      users: [],
    };
  }

  const { topCursor, bottomCursor } = await buildPaginationCursor(
    chamberTraceRef,
    traces,
    { bottomLatest: true },
  );

  return {
    entries,
    traces,
    // todo
    // requires timeline-specific response types (discriminated union)
    reflections: [],
    users: [],
    topCursor,
    bottomCursor,
  };
}
