import { VirtualList } from "@/components/virtual-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Reflection } from "./reflection";
import { useRowHeight } from "./hooks/useRowHeight";

export function ReflectionList({
  ids,
  isLoading,
  isRefreshing = false,
  hasMore = false,
  onLoadMore,
}: {
  ids: string[];
  isLoading: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
}) {
  const rowHeight = useRowHeight();

  return (
    <VirtualList
      items={ids}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      hasMore={hasMore}
      onLoadMore={onLoadMore}
      rowHeight={rowHeight}
      loadMoreTriggerOffset={2}
      emptyState={
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-sm">No reflections yet.</p>
        </div>
      }
      renderLoadingRow={(index) => <ReflectionLoadingRow key={index} />}
      renderRefreshingIndicator={() => (
        <div className="flex h-full items-center justify-center">
          <p className="text-muted-foreground text-xs">
            Loading more reflections...
          </p>
        </div>
      )}
      renderRow={(id) => <Reflection id={id} />}
    />
  );
}

function ReflectionLoadingRow() {
  return (
    <div className="rounded-xl border p-4">
      <div className="mb-4 flex items-center gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <Skeleton className="h-4 w-24" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="mt-2 h-4 w-3/4" />
    </div>
  );
}
