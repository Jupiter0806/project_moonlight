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

function mapEntry(reflection: Reflection): URTEntry {
  return {
    type: "reflection",
    entryId: `entry-${reflection.id}`,
    content: {
      id: reflection.id,
      displayType: "reflection",
    },
  };
}

export async function listReflections(
  db: Firestore,
  params: ListParams,
): Promise<TimelineApiResponse> {
  const reflectionRef = db.collection("reflections");

  const query = buildPaginationQuery(reflectionRef, params);

  const snapshot = await query.get();

  const reflections = snapshot.docs.map((doc) => doc.data() as Reflection);

  const entries = reflections.map(mapEntry);

  if (reflections.length === 0) {
    return {
      entries,
      traces: [],
      reflections,
      users: [],
    };
  }

  const { topCursor, bottomCursor } = await buildPaginationCursor(
    reflectionRef,
    reflections,
  );

  return {
    entries,
    reflections,
    // todo
    // requires timeline-specific response types (discriminated union)
    traces: [],
    users: [],
    topCursor,
    bottomCursor,
  };
}
