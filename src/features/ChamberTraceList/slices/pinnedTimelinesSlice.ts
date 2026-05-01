import { createSlice } from "@reduxjs/toolkit";
import type { PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { FetchState } from "@/types/FetchState";

/**
 * when component loaded, this tell it which timelines to fetch
 * and display, and which one is currently selected
 */

// todo
// figure out the relationship between this timeline and timeline in fetchTimeline
const AvailTimelines: { type: string; sort?: string }[] = [
  { type: "camphor" },
  { type: "camphor-translate", sort: "popular" },
  { type: "camphor-self" },
  { type: "camphor-today" },
];

interface PinnedTimelinesState {
  fetchState: FetchState;
  selectedTimeline: string | null;
  timelines: { type: string; sort?: string }[];
}

const initialState: PinnedTimelinesState = {
  fetchState: "none",
  selectedTimeline: null,
  timelines: AvailTimelines,
};

export const pinnedTimelinesSlice = createSlice({
  name: "pinnedTimelines",
  initialState,
  reducers: {
    setFetchState: (state, action: PayloadAction<FetchState>) => {
      state.fetchState = action.payload;
    },
    setSelectedTimeline: (state, action: PayloadAction<string | null>) => {
      state.selectedTimeline = action.payload;
    },
    setTimelines: (
      state,
      action: PayloadAction<{ type: string; sort?: string }[]>,
    ) => {
      state.timelines = action.payload;
    },
  },
});

export const { setFetchState, setSelectedTimeline, setTimelines } =
  pinnedTimelinesSlice.actions;

export const selectFetchState = (state: RootState) =>
  state.pinnedTimelines.fetchState;
export const selectSelectedTimeline = (state: RootState) =>
  state.pinnedTimelines.selectedTimeline;
export const selectTimelines = (state: RootState) =>
  state.pinnedTimelines.timelines;

export default pinnedTimelinesSlice.reducer;
