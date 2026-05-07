"use client";

import { useGetTimelineQuery } from "@/store/api/timelineApi";
import { useAppSelector } from "@/store/hooks";
import {
  selectURTEntries,
  selectURTFetchStatus,
} from "@/store/slices/urtSlice";
import { ReflectionList } from "../reflections/reflection-list";
import type { URTEntryUI } from "@/store/types";

export function MoonlightReflectionList() {
  const entries = useCamphorReflectionEntries();
  const isLoading =
    useAppSelector(selectURTFetchStatus("moonlightReflections")) === "loading";

  return (
    <ReflectionList
      ids={entries
        .filter((entry): entry is URTEntryUI => entry.type === "reflection")
        .map((entry) => entry.content.id)}
      isLoading={isLoading}
    />
  );
}

function useCamphorReflectionEntries() {
  // RTK Query: handles fetching, caching, and deduplication automatically.
  // On fulfilled, urtSlice + entitiesSlice both update via extraReducers/matchers.
  useGetTimelineQuery({
    timeline: "moonlightReflections",
    direction: "bottom",
  });

  return useAppSelector(selectURTEntries("moonlightReflections"));
}
