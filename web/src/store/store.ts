import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "@/features/counter/counterSlice";
import pinnedTimelinesReducer from "@/features/ChamberTraceList/slices/pinnedTimelinesSlice";
import urtReducer from "@/store/slices/urtSlice";
import entitiesReducer from "@/store/slices/entitiesSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
    pinnedTimelines: pinnedTimelinesReducer,
    urt: urtReducer,
    entities: entitiesReducer,
  },
});

// Infer RootState and AppDispatch from the store so they update automatically
// when slices are added or middleware changes.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
