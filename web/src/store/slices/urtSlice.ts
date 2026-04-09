import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { FetchState } from "@/types/FetchState";
import type { URTInstruction } from "@/types/URTInstruction";
import {
  fetchTimelineThunk,
  type URTTimeline,
  type URTEntry,
} from "@/store/thunks/fetchTimelineThunk";
import { timelineApi } from "@/store/api/timelineApi";

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
  moonlightReflections: emptyURT(),
  moonlightTraces: emptyURT(),
};

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

        state[timeline].fetchStatus[cursor] = "loaded";

        if (direction === "top") {
          state[timeline].entries.unshift(...response.entries);
          state[timeline].lastTopFetchTimestamp = now;
        } else {
          state[timeline].entries.push(...response.entries);
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

          state[timeline].fetchStatus[cursor] = "loaded";

          if (direction === "top") {
            state[timeline].entries.unshift(...response.entries);
            state[timeline].lastTopFetchTimestamp = now;
          } else {
            state[timeline].entries.push(...response.entries);
            state[timeline].lastFetchTimestamp = now;
          }

          if (response.newReflectionsBar) {
            state[timeline].newReflectionsBar = response.newReflectionsBar;
          }
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
  setFetchStatus,
  updateNewReflectionsBar,
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

export default urtSlice.reducer;
