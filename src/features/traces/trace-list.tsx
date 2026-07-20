import { List } from "@/components/list";
import { Trace } from "./trace";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAppSelector } from "@/store/hooks";
import {
  selectTraceById,
  selectTraceFetchStatus,
} from "@/store/slices/entitiesSlice";

export function TraceList({
  entries,
  isLoading,
}: {
  entries: string[];
  isLoading: boolean;
}) {
  return (
    <List isLoading={isLoading}>
      {entries.map((entry) => (
        <LoadingTrace key={entry} id={entry} />
      ))}
    </List>
  );
}

/**
 * this renders shimming loading while trace loading
 *
 */
function LoadingTrace({ id }: { id: string }) {
  const isLoading = useAppSelector(selectTraceFetchStatus(id)) === "loading";
  const trace = useAppSelector((state) => selectTraceById(state, id));

  if (isLoading) return <SkeletonCard />;

  if (!trace) return null;

  return <Trace traceId={id} displayType={`${trace.type}-trace`} />;
}

export function SkeletonCard() {
  return (
    <Card className="w-full">
      <CardHeader>
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </CardHeader>
      <CardContent>
        <Skeleton className="aspect-video w-full" />
      </CardContent>
    </Card>
  );
}
