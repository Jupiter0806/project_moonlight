import type { Firestore } from "firebase-admin/firestore";
import type {
  TimelineApiResponse,
  URTEntry,
} from "@/store/thunks/fetchTimelineThunk";
import type { ListParams } from "../types/pagination.types";
import { Trace } from "@/types/Trace";
import { Reflection } from "@/types/Reflection";
import { FetchState } from "@/types/FetchState";

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

// this is WRONG
// after relfection fetched, traceIds is fetched
export async function listReflectionTraces(
  db: Firestore,
  params: ListParams & { reflectionId: string },
): Promise<TimelineApiResponse> {
  const traceRef = db.collection("reflections").doc(params.reflectionId);

  const reflection = (await traceRef
    .get()
    .then((doc) => doc.data())) as Reflection;

  const traceRefs = reflection.traceIds.map((id) =>
    db.collection("traces").doc(id),
  );
  const snapshots = await db.getAll(...traceRefs);

  const fetchStatus: Record<string, FetchState> = {};

  const traces = snapshots
    .map((doc) => doc.data() as Trace)
    .filter((doc) => {
      const exists = Boolean(doc);
      if (!exists) {
        fetchStatus[doc.id] = "error";
      }
      return exists;
    });

  const entries = traces.map(mapEntry);

  if (traces.length === 0) {
    return {
      entries,
      traces,
      reflections: [],
      users: [],
    };
  }

  return {
    entries,
    traces,
    // todo
    // requires timeline-specific response types (discriminated union)
    reflections: [],
    users: [],
    topCursor: undefined,
    bottomCursor: undefined,
    fetchStatus,
  };
}
