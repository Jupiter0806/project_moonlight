"use client";

import { useCallback } from "react";
import {
  useGetTimelineQuery,
  useLazyGetTimelineQuery,
} from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";
import { ReflectionList } from "../reflections/reflection-list";

export function CamphorReflectionList() {
  const { ids, isLoading, isRefreshing, hasMore, loadMore } =
    useCamphorReflectionEntries();

  return (
    <ReflectionList
      ids={ids}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      hasMore={hasMore}
      onLoadMore={loadMore}
    />
  );
}

function useCamphorReflectionEntries() {
  const entries = useAppSelector(selectURTEntries("camphorReflections"));
  const initialFetchStatus = useAppSelector(
    selectURTFetchStatus("camphorReflections"),
  );

  const initialQuery = useGetTimelineQuery({
    timeline: "camphorReflections",
    direction: "bottom",
  });
  const [fetchNextPage, nextPageQuery] = useLazyGetTimelineQuery();

  const cursor = nextPageQuery.isUninitialized
    ? initialQuery.data?.bottomCursor
    : nextPageQuery.data?.bottomCursor;

  const loadMore = useCallback(async () => {
    if (!cursor || nextPageQuery.isFetching) return;

    await fetchNextPage({
      timeline: "camphorReflections",
      direction: "bottom",
      cursor,
    }).unwrap();
  }, [cursor, fetchNextPage, nextPageQuery.isFetching]);

  // RTK Query: handles fetching, caching, and deduplication automatically.
  // On fulfilled, urtSlice + entitiesSlice both update via extraReducers/matchers.
  const ids = entries.map((entry) => entry.content.id);
  const isLoading = ids.length === 0 && initialFetchStatus === "loading";
  const isRefreshing = ids.length > 0 && nextPageQuery.isFetching;
  const hasMore = typeof cursor === "string" && cursor.length > 0;

  return { ids, isLoading, isRefreshing, hasMore, loadMore };
}
