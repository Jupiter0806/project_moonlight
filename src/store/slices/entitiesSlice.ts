import { createSlice, createEntityAdapter } from "@reduxjs/toolkit";
import type { EntityState, PayloadAction } from "@reduxjs/toolkit";
import type { RootState } from "@/store/store";
import type { FetchState } from "@/types/FetchState";
import type { Reflection } from "@/types/Reflection";
import type { Trace } from "@/types/Trace";
import type { User } from "@/types/User";
import { fetchTimelineThunk } from "@/store/thunks/fetchTimelineThunk";
import { timelineApi } from "@/store/api/timelineApi";

const tracesAdapter = createEntityAdapter<Trace>();
const reflectionsAdapter = createEntityAdapter<Reflection>();
const usersAdapter = createEntityAdapter<User>();

/** Extra per-bucket metadata beyond what EntityAdapter provides. */
interface BucketMeta {
  fetchStatus: Record<string, FetchState>;
  errors: Record<string, string>;
}

interface EntitiesState {
  traces: EntityState<Trace, string> & BucketMeta;
  reflections: EntityState<Reflection, string> & BucketMeta;
  users: EntityState<User, string> & BucketMeta;
}

const emptyMeta = (): BucketMeta => ({ fetchStatus: {}, errors: {} });

const initialState: EntitiesState = {
  traces: tracesAdapter.getInitialState(emptyMeta()),
  reflections: reflectionsAdapter.getInitialState(emptyMeta()),
  users: usersAdapter.getInitialState(emptyMeta()),
};

export const entitiesSlice = createSlice({
  name: "entities",
  initialState,
  reducers: {
    upsertTraces: (state, action: PayloadAction<Trace[]>) => {
      tracesAdapter.upsertMany(state.traces, action.payload);
    },
    upsertReflections: (state, action: PayloadAction<Reflection[]>) => {
      reflectionsAdapter.upsertMany(state.reflections, action.payload);
    },
    removeReflection: (state, action: PayloadAction<{ id: string }>) => {
      reflectionsAdapter.removeOne(state.reflections, action.payload.id);
      delete state.reflections.errors[action.payload.id];
      delete state.reflections.fetchStatus[action.payload.id];
    },
    upsertUsers: (state, action: PayloadAction<User[]>) => {
      usersAdapter.upsertMany(state.users, action.payload);
    },
    setTraceError: (
      state,
      action: PayloadAction<{ id: string; error: string }>,
    ) => {
      state.traces.errors[action.payload.id] = action.payload.error;
    },
    clearTraceError: (state, action: PayloadAction<{ id: string }>) => {
      delete state.traces.errors[action.payload.id];
    },
    setReflectionError: (
      state,
      action: PayloadAction<{ id: string; error: string }>,
    ) => {
      state.reflections.errors[action.payload.id] = action.payload.error;
    },
    setTraceFetchStatus: (
      state,
      action: PayloadAction<{ id: string; status: FetchState }>,
    ) => {
      state.traces.fetchStatus[action.payload.id] = action.payload.status;
    },
    setReflectionFetchStatus: (
      state,
      action: PayloadAction<{ id: string; status: FetchState }>,
    ) => {
      state.reflections.fetchStatus[action.payload.id] = action.payload.status;
    },
  },
  extraReducers: (builder) => {
    // When a timeline fetch succeeds, normalize all returned entities into the store.
    // The urtSlice independently updates the ordered entry list.
    builder
      .addCase(fetchTimelineThunk.fulfilled, (state, action) => {
        const { traces, reflections, users } = action.payload.response;
        if (traces.length) tracesAdapter.upsertMany(state.traces, traces);
        if (reflections.length)
          reflectionsAdapter.upsertMany(state.reflections, reflections);
        if (users.length) usersAdapter.upsertMany(state.users, users);
      })
      // ── RTK Query matcher ─────────────────────────────────────────────────
      // action.payload is TimelineApiResponse directly (no wrapper object)
      .addMatcher(
        timelineApi.endpoints.getTimeline.matchFulfilled,
        (state, action) => {
          const { traces, reflections, users } = action.payload;
          if (traces.length) tracesAdapter.upsertMany(state.traces, traces);
          if (reflections.length)
            reflectionsAdapter.upsertMany(state.reflections, reflections);
          if (users.length) usersAdapter.upsertMany(state.users, users);
        },
      );
  },
});

export const {
  upsertTraces,
  upsertReflections,
  removeReflection,
  upsertUsers,
  setTraceError,
  clearTraceError,
  setReflectionError,
  setTraceFetchStatus,
  setReflectionFetchStatus,
} = entitiesSlice.actions;

// Entity adapter selectors — use these instead of accessing state.entities directly.
export const {
  selectAll: selectAllTraces,
  selectById: selectTraceById,
  selectIds: selectTraceIds,
} = tracesAdapter.getSelectors((state: RootState) => state.entities.traces);

export const {
  selectAll: selectAllReflections,
  selectById: selectReflectionById,
} = reflectionsAdapter.getSelectors(
  (state: RootState) => state.entities.reflections,
);

export const { selectAll: selectAllUsers, selectById: selectUserById } =
  usersAdapter.getSelectors((state: RootState) => state.entities.users);

export const selectTraceFetchStatus = (id: string) => (state: RootState) =>
  state.entities.traces.fetchStatus[id] ?? "none";

export const selectTraceError = (id: string) => (state: RootState) =>
  state.entities.traces.errors[id];

export const selectReflectionFetchStatus = (id: string) => (state: RootState) =>
  state.entities.reflections.fetchStatus[id] ?? "none";

export const selectReflectionError = (id: string) => (state: RootState) =>
  state.entities.reflections.errors[id];

export default entitiesSlice.reducer;
