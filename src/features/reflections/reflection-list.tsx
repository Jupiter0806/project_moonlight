import { VirtualList } from "@/components/virtual-list";
import { Skeleton } from "@/components/ui/skeleton";
import { Reflection } from "./reflection";
import { useRowHeight } from "./hooks/useRowHeight";
import { useHydrateMissingUsers } from "@/features/user/hooks/useHydrateMissingUsers";

const NEW_ITEMS_BAR_ITEM = { type: "new-items-bar" } as const;

export function ReflectionList({
  ids,
  isLoading,
  isRefreshing = false,
  hasMore = false,
  onLoadMore,
  newItemsCount = 0,
  onClickNewItems,
}: {
  ids: string[];
  isLoading: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  newItemsCount?: number;
  onClickNewItems?: () => void;
}) {
  const rowHeight = useRowHeight();
  useHydrateMissingUsers(ids);

  const items: Array<string | typeof NEW_ITEMS_BAR_ITEM> =
    newItemsCount > 0 ? [NEW_ITEMS_BAR_ITEM, ...ids] : ids;

  return (
    <VirtualList
      items={items}
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
      renderRow={(item) => {
        if (typeof item === "string") {
          return <Reflection id={item} />;
        }

        return (
          <button
            className="text-primary w-full rounded-md border px-3 py-2 text-center text-sm"
            onClick={onClickNewItems}
            type="button"
          >
            {newItemsCount} new reflections available. Click to load.
          </button>
        );
      }}
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
