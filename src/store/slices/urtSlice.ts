import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { FetchState } from "@/types/FetchState";
import type { URTInstruction } from "@/types/URTInstruction";
import { fetchTimelineThunk } from "@/store/thunks/fetchTimelineThunk";
import { timelineApi } from "@/store/api/timelineApi";
import type { URTEntry, URTEntryCursor, URTTimeline } from "../types";

interface URT {
  entries: URTEntry[];
  /**
   * Maps cursor key → fetch state.
   * "initial" is used as the key when no cursor is provided (first page).
   */
  fetchStatus: Record<string, FetchState>;
  /** Updated whenever new entries are fetched (direction: "new"). */
  lastFetchTimestamp: number;
  /** Updated whenever top entries are fetched (direction: "top"). */
  lastTopFetchTimestamp: number;
  responseObjects: {
    highlightedTraceText: unknown;
    correctedTranslation: unknown;
  };
  newReflectionsBar: {
    count: number;
    instructions: URTInstruction[];
  };
}

interface URTState {
  camphorReflections: URT;
  camphorTraces: URT;
  chamberTraces: URT;
  moonlightReflections: URT;
  moonlightTraces: URT;
}

const emptyURT = (): URT => ({
  entries: [],
  fetchStatus: {},
  lastFetchTimestamp: 0,
  lastTopFetchTimestamp: 0,
  responseObjects: { highlightedTraceText: null, correctedTranslation: null },
  newReflectionsBar: { count: 0, instructions: [] },
});

const initialState: URTState = {
  camphorReflections: emptyURT(),
  camphorTraces: emptyURT(),
  chamberTraces: emptyURT(),
  moonlightReflections: emptyURT(),
  moonlightTraces: emptyURT(),
};

export function buildCursorEntry(
  position: "top" | "bottom",
  cursor: string,
): URTEntryCursor {
  return {
    type: "timeline-cursor",
    entryId: `cursor-${position}-${cursor}`,
    content: { cursorType: position, value: cursor },
  };
}

/**
 * Upserts a cursor boundary entry at a stable position in the entries array.
 *
 * Stable entryIds ("cursor-top" / "cursor-bottom") mean the entry is
 * replaced in-place when the cursor advances, rather than accumulating one
 * entry per page. cursor=null removes the entry if present.
 */
function upsertCursorEntry(
  entries: URTEntry[],
  position: "top" | "bottom",
  cursor: string | null | undefined,
) {
  const newEntry = buildCursorEntry(position, cursor ?? "none");
  const entryId = newEntry.entryId;

  const existingIndex = entries.findIndex((e) => e.entryId === entryId);

  if (!cursor) {
    if (existingIndex >= 0) entries.splice(existingIndex, 1);
    return;
  }

  if (existingIndex >= 0) {
    entries[existingIndex] = newEntry;
  } else if (position === "bottom") {
    entries.push(newEntry);
  } else {
    entries.unshift(newEntry);
  }
}

export const urtSlice = createSlice({
  name: "urt",
  initialState,
  reducers: {
    appendEntries: (
      state,
      action: PayloadAction<{ timeline: URTTimeline; entries: URTEntry[] }>,
    ) => {
      state[action.payload.timeline].entries.push(...action.payload.entries);
    },
    prependEntries: (
      state,
      action: PayloadAction<{ timeline: URTTimeline; entries: URTEntry[] }>,
    ) => {
      state[action.payload.timeline].entries.unshift(...action.payload.entries);
    },
    replaceEntryByContentId: (
      state,
      action: PayloadAction<{
        timeline: URTTimeline;
        fromContentId: string;
        entry: URTEntry;
      }>,
    ) => {
      const { timeline, fromContentId, entry } = action.payload;
      const entries = state[timeline].entries;
      const index = entries.findIndex(
        (item) =>
          (item.type === "trace" || item.type === "reflection") &&
          item.content.id === fromContentId,
      );

      if (index >= 0) {
        entries[index] = entry;
      } else {
        entries.unshift(entry);
      }
    },
    removeEntryByContentId: (
      state,
      action: PayloadAction<{ timeline: URTTimeline; contentId: string }>,
    ) => {
      const { timeline, contentId } = action.payload;
      state[timeline].entries = state[timeline].entries.filter(
        (entry) =>
          (entry.type === "trace" || entry.type === "reflection") &&
          entry.content.id !== contentId,
      );
    },
    setFetchStatus: (
      state,
      action: PayloadAction<{
        timeline: URTTimeline;
        cursor: string;
        status: FetchState;
      }>,
    ) => {
      const { timeline, cursor, status } = action.payload;
      state[timeline].fetchStatus[cursor] = status;
    },
    updateNewReflectionsBar: (
      state,
      action: PayloadAction<{
        timeline: URTTimeline;
        bar: URT["newReflectionsBar"];
      }>,
    ) => {
      state[action.payload.timeline].newReflectionsBar = action.payload.bar;
    },
    appendNewEntriesBar: (
      state,
      action: PayloadAction<{
        timeline: URTTimeline;
        bar: URT["newReflectionsBar"];
      }>,
    ) => {
      state[action.payload.timeline].newReflectionsBar = {
        count:
          state[action.payload.timeline].newReflectionsBar.count +
          action.payload.bar.count,
        instructions: [
          ...state[action.payload.timeline].newReflectionsBar.instructions,
          ...action.payload.bar.instructions,
        ],
      };
    },
    resetTimeline: (state, action: PayloadAction<URTTimeline>) => {
      state[action.payload] = emptyURT();
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTimelineThunk.pending, (state, action) => {
        const { timeline, cursor = "initial" } = action.meta.arg;
        state[timeline].fetchStatus[cursor] = "loading";
      })
      .addCase(fetchTimelineThunk.fulfilled, (state, action) => {
        const {
          timeline,
          direction,
          cursor = "initial",
          response,
        } = action.payload;
        const now = Date.now();

        state[timeline].fetchStatus[cursor] = "done";

        const isChamberUpdatesOnly =
          timeline === "chamberTraces" && direction === "new";

        if (isChamberUpdatesOnly) {
          state[timeline].lastFetchTimestamp = now;
          if (response.newReflectionsBar) {
            state[timeline].newReflectionsBar = {
              count:
                state[timeline].newReflectionsBar.count +
                response.newReflectionsBar.count,
              instructions: [
                ...state[timeline].newReflectionsBar.instructions,
                ...response.newReflectionsBar.instructions,
              ],
            };
          }
          return;
        }

        if (direction === "top") {
          state[timeline].entries.unshift(...response.entries);
          if (timeline === "chamberTraces") {
            upsertCursorEntry(
              state[timeline].entries,
              "top",
              response.topCursor,
            );
          }
          state[timeline].lastTopFetchTimestamp = now;
        } else {
          state[timeline].entries.push(...response.entries);
          if (timeline === "chamberTraces") {
            upsertCursorEntry(
              state[timeline].entries,
              "bottom",
              response.bottomCursor,
            );
          }
          state[timeline].lastFetchTimestamp = now;
        }

        if (response.newReflectionsBar) {
          state[timeline].newReflectionsBar = response.newReflectionsBar;
        }
      })
      .addCase(fetchTimelineThunk.rejected, (state, action) => {
        const { timeline, cursor = "initial" } = action.meta.arg;
        state[timeline].fetchStatus[cursor] = "none";
      })
      // ── RTK Query matchers ────────────────────────────────────────────────
      // action.meta.arg.originalArgs  → the FetchTimelineArg passed to the hook
      // action.payload                → TimelineApiResponse (the resolved data)
      .addMatcher(
        timelineApi.endpoints.getTimeline.matchPending,
        (state, action) => {
          const { timeline, cursor = "initial" } = action.meta.arg.originalArgs;
          state[timeline].fetchStatus[cursor] = "loading";
        },
      )
      .addMatcher(
        timelineApi.endpoints.getTimeline.matchFulfilled,
        (state, action) => {
          const {
            timeline,
            direction,
            cursor = "initial",
          } = action.meta.arg.originalArgs;
          const response = action.payload;
          const now = Date.now();

          state[timeline].fetchStatus[cursor] = "done";

          const isChamberUpdatesOnly =
            timeline === "chamberTraces" && direction === "new";

          if (isChamberUpdatesOnly) {
            state[timeline].lastFetchTimestamp = now;
            if (response.newReflectionsBar) {
              state[timeline].newReflectionsBar = {
                count:
                  state[timeline].newReflectionsBar.count +
                  response.newReflectionsBar.count,
                instructions: [
                  ...state[timeline].newReflectionsBar.instructions,
                  ...response.newReflectionsBar.instructions,
                ],
              };
            }
            return;
          }

          if (direction === "top") {
            state[timeline].entries.unshift(...response.entries);
            if (timeline === "chamberTraces") {
              upsertCursorEntry(
                state[timeline].entries,
                "top",
                response.topCursor,
              );
            }
            state[timeline].lastTopFetchTimestamp = now;
          } else {
            state[timeline].entries.push(...response.entries);
            if (timeline === "chamberTraces") {
              upsertCursorEntry(
                state[timeline].entries,
                "bottom",
                response.bottomCursor,
              );
            }
            state[timeline].lastFetchTimestamp = now;
          }

          if (response.newReflectionsBar) {
            state[timeline].newReflectionsBar = response.newReflectionsBar;
          }
        },
      )
      .addMatcher(
        timelineApi.endpoints.getChamberUpdates.matchFulfilled,
        (state, action) => {
          const response = action.payload;
          state.chamberTraces.lastFetchTimestamp = Date.now();

          // Always advance the boundary cursor (echo-back on empty = no-op advance)
          upsertCursorEntry(
            state.chamberTraces.entries,
            "bottom",
            response.bottomCursor,
          );

          const count =
            response.newReflectionsBar?.count ?? response.entries.length;
          const instructions = response.newReflectionsBar?.instructions ?? [];

          if (count === 0 && instructions.length === 0) {
            return;
          }

          state.chamberTraces.newReflectionsBar = {
            count: state.chamberTraces.newReflectionsBar.count + count,
            instructions: [
              ...state.chamberTraces.newReflectionsBar.instructions,
              ...instructions,
            ],
          };
        },
      )
      .addMatcher(
        timelineApi.endpoints.getTimeline.matchRejected,
        (state, action) => {
          const { timeline, cursor = "initial" } = action.meta.arg.originalArgs;
          state[timeline].fetchStatus[cursor] = "none";
        },
      );
  },
});

export const {
  appendEntries,
  prependEntries,
  replaceEntryByContentId,
  removeEntryByContentId,
  setFetchStatus,
  updateNewReflectionsBar,
  appendNewEntriesBar,
  resetTimeline,
} = urtSlice.actions;

export const selectURT = (timeline: URTTimeline) => (state: RootState) =>
  state.urt[timeline];

export const selectURTEntries = (timeline: URTTimeline) => (state: RootState) =>
  state.urt[timeline].entries;

export const selectURTFetchStatus =
  (timeline: URTTimeline, cursor = "initial") =>
  (state: RootState) =>
    state.urt[timeline].fetchStatus[cursor] ?? "none";

export const selectNewReflectionsBar =
  (timeline: URTTimeline) => (state: RootState) =>
    state.urt[timeline].newReflectionsBar;

/**
 * Returns the updates boundary cursor for chamber traces.
 * This is the last cursor with "bottom" entry — pointing to the latest trace
 * the client has seen. The updates long-poll uses this as its starting point.
 * null means no initial fetch has completed yet.
 */
export const selectChamberUpdatesCursor = (
  state: RootState,
): URTEntryCursor | null =>
  state.urt.chamberTraces.entries.findLast(
    (e): e is URTEntryCursor =>
      e.type === "timeline-cursor" && e.content.cursorType === "bottom",
  ) ?? null;

export default urtSlice.reducer;
