"use client";

import { useCallback, useMemo } from "react";
import {
  useGetTimelineQuery,
  useLazyGetTimelineQuery,
} from "@/store/api/timelineApi";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  runNewEntriesBarInstructions,
  selectNewReflectionsBar,
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";
import { ReflectionList } from "../reflections/reflection-list";
import { URTEntryUI } from "@/store/types";
import { ReflectionsUpdatesListener } from "./components/reflections-updates-listener";

export function CamphorReflectionList() {
  const { ids, isLoading, isRefreshing, hasMore, loadMore } =
    useCamphorReflectionEntries();
  const { newReflectionsCount, onClickNewItems } =
    useCamphorNewReflectionsBarState();

  return (
    <>
      <ReflectionsUpdatesListener />
      <ReflectionList
        ids={ids}
        isLoading={isLoading}
        isRefreshing={isRefreshing}
        hasMore={hasMore}
        onLoadMore={loadMore}
        newItemsCount={newReflectionsCount}
        onClickNewItems={onClickNewItems}
      />
    </>
  );
}

function useCamphorNewReflectionsBarState() {
  const dispatch = useAppDispatch();
  const newReflectionsCount =
    useAppSelector(selectNewReflectionsBar("camphorReflections"))?.count ?? 0;

  const onClickNewItems = useCallback(() => {
    dispatch(runNewEntriesBarInstructions({ timeline: "camphorReflections" }));
  }, [dispatch]);

  return { newReflectionsCount, onClickNewItems };
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
  const ids = useMemo(
    () =>
      entries
        .filter((entry): entry is URTEntryUI => entry.type === "reflection")
        .map((entry) => entry.content.id),
    [entries],
  );
  const isLoading = ids.length === 0 && initialFetchStatus === "loading";
  const isRefreshing = ids.length > 0 && nextPageQuery.isFetching;
  const hasMore = typeof cursor === "string" && cursor.length > 0;

  return { ids, isLoading, isRefreshing, hasMore, loadMore };
}
