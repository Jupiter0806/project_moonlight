import { configureStore } from "@reduxjs/toolkit";
import counterReducer from "@/features/counter/counterSlice";

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
});

// Infer RootState and AppDispatch from the store so they update automatically
// when slices are added or middleware changes.
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
