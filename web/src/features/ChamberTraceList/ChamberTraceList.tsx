/**
 *
 * - TODO: map over answers from state/atoms and render each answer card
 * - TODO: auto-scroll to the latest answer when new content arrives
 * - TODO: preserve scroll position when the keyboard opens/closes
 */

import { useAppSelector } from "@/store/hooks";
import { useQuery } from "@tanstack/react-query";

export function ChamberTraceList() {
  const { data, isLoading } = useTraceList();

  console.log("Traces data:", data, isLoading);

  return <div className="h-full overflow-y-auto">traces</div>;
}

function useTraceList() {
  const timeline = useAppSelector(
    (state) => state.pinnedTimelines.selectedTimeline,
  );

  return useQuery({
    queryKey: ["traces", timeline],
    queryFn: () => fetchTraces(timeline!),
    enabled: !!timeline,
  });
}

async function fetchTraces(timeline: string) {
  console.log("Traces data:", timeline);

  return Promise.resolve([]);
}
