import { createAsyncThunk } from "@reduxjs/toolkit";
import {
  URTTimeline,
  TimelineApiResponse,
  FetchTimelineResult,
  FetchTimelineArg,
} from "../types";

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
        content: { id: "trace-1", displayType: "qa-trace" },
      },
      {
        type: "trace",
        entryId: "entry-t2",
        content: { id: "trace-2", displayType: "translation-trace" },
      },
    ],
    traces: [
      {
        id: "trace-1",
        createdAt: 1712649600000,
        q: "What is wabi-sabi?",
        a: "Finding beauty in imperfection.",
        user: "user-1",
        reflection: "reflection-1",
        liked: null,
        type: "translation",
        sourceLang: "en",
        targetLang: "zh-CN",
      },
      {
        id: "trace-2",
        createdAt: 1712649700000,
        q: "侘び寂びとは？",
        a: "不完全さに美を見出すこと。",
        user: "user-2",
        reflection: "reflection-1",
        liked: null,
        type: "translation",
        sourceLang: "en",
        targetLang: "zh-CN",
      },
    ],
    reflections: [
      {
        id: "reflection-1",
        createdAt: 1712649500000,
        summary: "A thread on wabi-sabi",
        uid: "user-1",
        traceIds: ["trace-1", "trace-2"],
      },
    ],
    users: [
      { id: "user-1", displayName: "Alice", email: "alice@example.com" },
      { id: "user-2", displayName: "Bob", email: "bob@example.com" },
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
