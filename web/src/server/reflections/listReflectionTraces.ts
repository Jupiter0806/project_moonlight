import type { Firestore } from "firebase-admin/firestore";
import type {
  TimelineApiResponse,
  URTEntry,
} from "@/store/thunks/fetchTimelineThunk";
import type { ListParams } from "../types/pagination.types";
import {
  buildPaginationCursor,
  buildPaginationQuery,
} from "../helpers/pagination-helpers";
import type { Reflection } from "@/types/Reflection";
import { Trace } from "@/types/Trace";

function mapEntry(trace: Trace): URTEntry {
  return {
    type: "trace",
    entryId: `entry-${trace.id}`,
    content: {
      id: trace.id,
      displayType: `${trace.type}-trace`,
    },
  };
}

export async function listReflectionTraces(
  db: Firestore,
  params: ListParams & { reflectionId: string },
): Promise<TimelineApiResponse> {
  const traceRef = db
    .collection("reflections")
    .doc(params.reflectionId)
    .collection("traces");

  const query = buildPaginationQuery(traceRef, params);

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
    traceRef,
    traces,
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
