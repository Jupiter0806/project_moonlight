import type { Firestore } from "firebase-admin/firestore";
import type { ListParams } from "../types/pagination.types";
import {
  buildPaginationCursor,
  buildPaginationQuery,
} from "../helpers/pagination-helpers";
import type { Reflection } from "@/types/Reflection";
import { serializeFirestoreValue } from "@/server/helpers/firestore-serialization";
import type { URTEntry, TimelineApiResponse } from "@/store/types";

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
  const reflectionQuery = reflectionRef.where("uid", "==", params.uid);

  const query = buildPaginationQuery(reflectionQuery, params);

  const snapshot = await query.get();

  const rawReflections = snapshot.docs.map((doc) => doc.data() as Reflection);
  const reflections = rawReflections.map((reflection) =>
    serializeFirestoreValue(reflection),
  );

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
    reflectionQuery,
    rawReflections,
    { direction: params.direction },
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
