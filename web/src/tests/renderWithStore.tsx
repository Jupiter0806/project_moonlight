import { render, type RenderResult } from "@testing-library/react";
import { createStore, Provider } from "jotai";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { configureStore, type EnhancedStore } from "@reduxjs/toolkit";
import { Provider as ReduxProvider } from "react-redux";
import counterReducer from "@/features/counter/counterSlice";
import pinnedTimelinesReducer from "@/features/ChamberTraceList/slices/pinnedTimelinesSlice";
import urtReducer from "@/store/slices/urtSlice";
import entitiesReducer from "@/store/slices/entitiesSlice";
import { timelineApi } from "@/store/api/timelineApi";

export function createReduxStore(): EnhancedStore {
  return configureStore({
    reducer: {
      counter: counterReducer,
      pinnedTimelines: pinnedTimelinesReducer,
      urt: urtReducer,
      entities: entitiesReducer,
      [timelineApi.reducerPath]: timelineApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(timelineApi.middleware),
  });
}

interface RenderWithStoreResult extends RenderResult {
  store: ReturnType<typeof createStore>;
  reduxStore: EnhancedStore;
  queryClient: QueryClient;
}

/**
 * Renders `ui` wrapped in Jotai, Redux, and React Query providers.
 *
 * @param ui         - The component to render.
 * @param jotaiStore - Optional Jotai store (creates a fresh one by default).
 * @param reduxStore - Optional Redux store (creates a fresh one by default).
 */
export function renderWithStore(
  ui: React.ReactElement,
  jotaiStore: ReturnType<typeof createStore> = createStore(),
  reduxStore: EnhancedStore = createReduxStore(),
): RenderWithStoreResult {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return {
    store: jotaiStore,
    reduxStore,
    queryClient,
    ...render(
      <ReduxProvider store={reduxStore}>
        <QueryClientProvider client={queryClient}>
          <Provider store={jotaiStore}>{ui}</Provider>
        </QueryClientProvider>
      </ReduxProvider>,
    ),
  };
}
