import { cn } from "@/lib/utils";
import { WithClassName } from "@/types/withClassName";
import { PropsWithChildren } from "react";

/**
 *
 * should handle virtual list
 */

interface ListProps extends PropsWithChildren, WithClassName {
  itemHeight?: number; // for virtual list, default to 80px
  isLoading?: boolean; // for showing loading skeletons
}

export function List(props: ListProps) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-4 overflow-y-auto",
        props.className,
      )}
    >
      {props.isLoading && (
        <div className="flex items-center justify-center">
          <p className="text-sm">Loading...</p>
        </div>
      )}
      {props.children}
    </div>
  );
}
