import { configureStore } from "@reduxjs/toolkit";
import type { Middleware } from "@reduxjs/toolkit";
import counterReducer from "@/features/counter/counterSlice";
import pinnedTimelinesReducer from "@/features/ChamberTraceList/slices/pinnedTimelinesSlice";
import urtReducer from "@/store/slices/urtSlice";
import entitiesReducer from "@/store/slices/entitiesSlice";
import sessionReducer from "@/store/slices/sessionSlice";
import { timelineApi } from "@/store/api/timelineApi";

// Register every createApi instance here.
// Each entry's reducer and middleware are wired up automatically below.
const apis = [timelineApi] as const;

const apiReducers = Object.fromEntries(
  apis.map((api) => [api.reducerPath, api.reducer]),
);

const apiMiddlewares: Middleware[] = apis.map((api) => api.middleware);

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    pinnedTimelines: pinnedTimelinesReducer,
    session: sessionReducer,
    urt: urtReducer,
    entities: entitiesReducer,
    ...apiReducers,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(...apiMiddlewares),
});

// Infer RootState and AppDispatch from the store so they update automatically
// when slices are added or middleware changes.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
