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

export async function listTodayReflections(
  db: Firestore,
  params: ListParams,
): Promise<TimelineApiResponse> {
  const reflectionRef = db.collection("reflections");

  const now = new Date();
  const currentHour = now.getHours();

  // If currently before 2 AM, consider it part of the previous day's cycle
  // e.g. 1 AM on Tuesday belongs to the "Monday" session (Mon 2AM -> Tue 2AM)
  const dayOffset = currentHour < 2 ? -1 : 0;

  // Local start of day at 2 AM
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset,
    2,
    0,
    0,
  );

  // End of day (start of tomorrow at 2 AM)
  const endOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + dayOffset + 1,
    2,
    0,
    0,
  );

  const query = reflectionRef
    .where("uid", "==", params.uid)
    .where("createdAt", ">=", startOfDay)
    .where("createdAt", "<", endOfDay)
    .orderBy("createdAt", "asc")
    .orderBy("id", "asc");

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
