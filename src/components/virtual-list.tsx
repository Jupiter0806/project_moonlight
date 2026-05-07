import { cn } from "@/lib/utils";
import { WithClassName } from "@/types/withClassName";
import { useAutoHideScrollbar } from "@/hooks/use-auto-hide-scrollbar";
import { CSSProperties, ReactNode, Ref, useEffect, useRef } from "react";
import { List } from "react-window";
import type { DynamicRowHeight, ListImperativeAPI } from "react-window";

/**
 * Warns in development when VirtualList's container does not have a bounded
 * height, which causes react-window to measure the viewport as the full list
 * height and render every row — defeating virtualisation entirely.
 *
 * The most common cause is a flex parent missing `min-h-0` (flex children
 * default to `min-height: auto`, which lets them grow beyond the container).
 * Required parent setup: `flex flex-col` ancestor + `min-h-0 flex-1` on the
 * direct container of VirtualList.
 */
function useVirtualListHeightGuard(
  containerRef: React.RefObject<HTMLElement | null>,
  rowCount: number,
  rowHeight:
    | number
    | string
    | DynamicRowHeight
    | ((index: number, cellProps: object) => number),
) {
  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    if (!containerRef.current) return;

    const el = containerRef.current;

    const check = () => {
      const { height } = el.getBoundingClientRect();
      const sampleHeight =
        typeof rowHeight === "function"
          ? rowHeight(0, {})
          : typeof rowHeight === "number"
            ? rowHeight
            : typeof rowHeight === "string"
              ? Number.parseFloat(rowHeight)
              : (rowHeight.getRowHeight(0) ?? rowHeight.getAverageRowHeight());
      const totalContentHeight = rowCount * sampleHeight;
      // If measured height ≥ total content height, the container is not
      // constraining the list — it grew to fit the content instead.
      if (height > 0 && height >= totalContentHeight && rowCount > 3) {
        console.warn(
          "[VirtualList] Container height (%dpx) ≥ total content height (%dpx).\n" +
            "Virtualisation is not active — all %d rows will be rendered.\n" +
            "Fix: ensure the parent chain has a bounded height.\n" +
            "Required classes: flex flex-col on the ancestor + min-h-0 flex-1 on the direct container.",
          Math.round(height),
          Math.round(totalContentHeight),
          rowCount,
        );
      }
    };

    const observer = new ResizeObserver(check);
    observer.observe(el);
    return () => observer.disconnect();
  }, [containerRef, rowCount, rowHeight]);
}

type RowRenderer<T> = (item: T, index: number) => ReactNode;

interface VirtualListRowProps<T> {
  items: readonly T[];
  renderRow: RowRenderer<T>;
  hasLoadMoreRow: boolean;
  isRefreshing: boolean;
  renderRefreshingIndicator?: () => ReactNode;
}

interface VirtualListProps<T> extends WithClassName {
  items: readonly T[];
  rowHeight?:
    | number
    | string
    | DynamicRowHeight
    | ((index: number, cellProps: object) => number);
  loaderRowHeight?: number;
  hiddenSentinelRowHeight?: number;
  overscanCount?: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void | Promise<void>;
  loadingRowCount?: number;
  loadMoreTriggerOffset?: number;
  emptyState?: ReactNode;
  renderLoadingRow?: (index: number) => ReactNode;
  renderRefreshingIndicator?: () => ReactNode;
  renderRow: RowRenderer<T>;
  listRef?: Ref<ListImperativeAPI>;
}

function VirtualListRow<T>({
  ariaAttributes,
  index,
  style,
  items,
  renderRow,
  hasLoadMoreRow,
  isRefreshing,
  renderRefreshingIndicator,
}: {
  ariaAttributes: {
    "aria-posinset": number;
    "aria-setsize": number;
    role: "listitem";
  };
  index: number;
  style: CSSProperties;
} & VirtualListRowProps<T>) {
  return (
    <div style={style} {...ariaAttributes}>
      {hasLoadMoreRow && index === items.length
        ? isRefreshing
          ? (renderRefreshingIndicator?.() ?? (
              <div className="flex h-full items-center justify-center py-2">
                <p className="text-muted-foreground text-xs">Loading more...</p>
              </div>
            ))
          : null
        : renderRow(items[index], index)}
    </div>
  );
}

export function VirtualList<T>({
  className,
  items,
  rowHeight = 96,
  loaderRowHeight = 56,
  hiddenSentinelRowHeight = 1,
  overscanCount = 3,
  isLoading = false,
  isRefreshing = false,
  hasMore = false,
  onLoadMore,
  loadingRowCount = 6,
  loadMoreTriggerOffset = 0,
  emptyState = null,
  renderLoadingRow,
  renderRefreshingIndicator,
  renderRow,
  listRef,
}: VirtualListProps<T>) {
  // A Promise ref ensures only one onLoadMore is in-flight at a time.
  // It is synchronously set before the async call and cleared only after
  // the Promise settles — no dependency on React render cycles.
  const pendingLoadRef = useRef<Promise<void> | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const { scrollbarClassName, markScrolling } = useAutoHideScrollbar();
  const hasLoadMoreRow = hasMore || isRefreshing;
  const rowCount = items.length + (hasLoadMoreRow ? 1 : 0);
  const resolvedRowHeight = hasLoadMoreRow
    ? (index: number) =>
        index === items.length
          ? isRefreshing
            ? loaderRowHeight
            : hiddenSentinelRowHeight
          : typeof rowHeight === "function"
            ? rowHeight(index, {})
            : typeof rowHeight === "number"
              ? rowHeight
              : typeof rowHeight === "string"
                ? Number.parseFloat(rowHeight)
                : (rowHeight.getRowHeight(index) ??
                  rowHeight.getAverageRowHeight())
    : rowHeight;

  useVirtualListHeightGuard(containerRef, rowCount, rowHeight);

  if (isLoading) {
    if (!renderLoadingRow) {
      return (
        <div
          className={cn("flex h-full items-center justify-center", className)}
        >
          <p className="text-sm">Loading...</p>
        </div>
      );
    }

    const placeholderCount = Math.max(1, loadingRowCount);
    const placeholders = Array.from(
      { length: placeholderCount },
      (_, index) => <div key={index}>{renderLoadingRow(index)}</div>,
    );

    return (
      <div
        className={cn(
          scrollbarClassName,
          "flex h-full flex-col gap-4 overflow-y-auto",
          className,
        )}
        onScroll={(event) => markScrolling(event.currentTarget)}
      >
        {placeholders}
      </div>
    );
  }

  if (items.length === 0) {
    return <div className={cn("h-full w-full", className)}>{emptyState}</div>;
  }

  return (
    <div ref={containerRef} className={cn("h-full", className)}>
      <List
        listRef={listRef}
        className={cn(scrollbarClassName, "h-full")}
        onScroll={(event) => markScrolling(event.currentTarget)}
        overscanCount={overscanCount}
        onRowsRendered={(visibleRows, allRows) => {
          if (!hasMore || isRefreshing || !onLoadMore) return;
          if (pendingLoadRef.current) return;

          const triggerIndex = Math.max(
            0,
            items.length - loadMoreTriggerOffset,
          );
          const reachedTrigger =
            allRows.stopIndex >= triggerIndex ||
            visibleRows.stopIndex >= triggerIndex;

          if (!reachedTrigger) return;

          pendingLoadRef.current = Promise.resolve(onLoadMore()).finally(() => {
            pendingLoadRef.current = null;
          });
        }}
        rowComponent={VirtualListRow<T>}
        rowCount={rowCount}
        rowHeight={resolvedRowHeight}
        rowProps={{
          items,
          renderRow,
          hasLoadMoreRow,
          isRefreshing,
          renderRefreshingIndicator,
        }}
      />
    </div>
  );
}
