import { createAsyncThunk } from "@reduxjs/toolkit";
import type { Trace } from "@/types/Trace";
import type { Reflection } from "@/types/Reflection";
import type { User } from "@/types/User";
import type { URTInstruction } from "@/types/URTInstruction";

// Exported here to avoid circular imports between urtSlice ↔ entitiesSlice ↔ store.
export type URTTimeline =
  | "camphorReflections"
  | "camphorTraces"
  | "chamberTraces"
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

// ---------------------------------------------------------------------------
// Mock data — simulates what a real API would return for camphorTraces.
// Replace the mock branch with: const response = await timelineService.fetch(...)
// ---------------------------------------------------------------------------

export const MOCK_DB: Partial<Record<URTTimeline, TimelineApiResponse>> = {
  camphorTraces: {
    entries: [
      {
        type: "trace",
        entryId: "entry-t1",
        content: { id: "trace-1", displayType: "trace" },
      },
      {
        type: "trace",
        entryId: "entry-t2",
        content: { id: "trace-2", displayType: "translationTrace" },
      },
    ],
    traces: [
      {
        id: "trace-1",
        created_at: 1712649600000,
        q: "What is wabi-sabi?",
        a: "Finding beauty in imperfection.",
        user: "user-1",
        reflection: "reflection-1",
        type: "translation",
      },
      {
        id: "trace-2",
        created_at: 1712649700000,
        q: "侘び寂びとは？",
        a: "不完全さに美を見出すこと。",
        user: "user-2",
        reflection: "reflection-1",
        type: "translation",
      },
    ],
    reflections: [
      {
        id: "reflection-1",
        created_at: 1712649500000,
        description: "A thread on wabi-sabi",
        user: "user-1",
        entities: { traces: [] },
      },
    ],
    users: [
      { id: "user-1", name: "Alice", email: "alice@example.com" },
      { id: "user-2", name: "Bob", email: "bob@example.com" },
    ],
    nextCursor: "cursor-page-2",
    newReflectionsBar: { count: 3, instructions: [] },
  },
};

export const fetchTimelineThunk = createAsyncThunk<
  FetchTimelineResult,
  FetchTimelineArg
>(
  "timeline/fetch",
  async ({ timeline, cursor, direction }): Promise<FetchTimelineResult> => {
    // Simulate network latency
    await new Promise((r) => setTimeout(r, 400));

    const mock = MOCK_DB[timeline];
    if (!mock) {
      throw new Error(`No mock data for timeline: ${timeline}`);
    }

    // TODO: swap this block for the real API call:
    // const response = await timelineService.fetch(timeline, { cursor, direction });
    return { timeline, direction, cursor, response: mock };
  },
);
