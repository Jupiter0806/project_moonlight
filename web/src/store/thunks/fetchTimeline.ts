import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Trace } from "@/types/Trace";
import type { Reflection } from "@/types/Reflection";
import type { User } from "@/types/User";
import type { URTInstruction } from "@/types/URTInstruction";

// Exported here to avoid circular imports between urtSlice ↔ entitiesSlice ↔ store.
export type URTTimeline =
  | "camphorReflections"
  | "camphorTraces"
  | "moonlightReflections"
  | "moonlightTraces";

export interface URTEntry {
  type: "timelineCursor" | "trace" | "reflection";
  entryId: string;
  content: {
    id: string;
    displayType:
      | "reflection"
      | "translationReflection"
      | "trace"
      | "translationTrace";
  };
}

export interface TimelineApiResponse {
  entries: URTEntry[];
  traces: Trace[];
  reflections: Reflection[];
  users: User[];
  nextCursor?: string;
  newReflectionsBar?: {
    count: number;
    instructions: URTInstruction[];
  };
}

export interface FetchTimelineArg {
  timeline: URTTimeline;
  /** Pagination cursor; omit for the initial page ("initial" is used as the key). */
  cursor?: string;
  direction: "top" | "new";
}

export interface FetchTimelineResult {
  timeline: URTTimeline;
  direction: "top" | "new";
  cursor?: string;
  response: TimelineApiResponse;
}

// todo
// understanding thunk
export const fetchTimeline = createAsyncThunk<
  FetchTimelineResult,
  FetchTimelineArg
>(
  "timeline/fetch",
  async ({ timeline, cursor, direction }): Promise<FetchTimelineResult> => {
    // TODO: replace with actual timeline API service call
    // const response = await timelineService.fetch(timeline, { cursor, direction });
    throw new Error(
      `fetchTimeline not implemented for: ${timeline} cursor: ${cursor} direction: ${direction}`,
    );
  },
);

/**
 * dispatch(fetchTimeline({ timeline: "camphorTraces", direction: "new" }))
  │
  ├── urtSlice.pending    → camphorTraces.fetchStatus["initial"] = "loading"
  ├── urtSlice.fulfilled  → appends entries, marks "loaded", updates timestamp
  │
  └── entitiesSlice.fulfilled → upsertMany traces/reflections/users by id
 */
