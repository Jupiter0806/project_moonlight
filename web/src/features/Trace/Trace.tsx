import { useAppSelector } from "@/store/hooks";
import { selectTraceById } from "@/store/slices/entitiesSlice";
import type { WithClassName } from "@/types/withClassName";
import { clsx } from "clsx";

interface TraceProps extends WithClassName {
  traceId: string;
}

export function Trace({ traceId, className }: TraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));

  const date = new Date(trace.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      // use clsx
      className={clsx(
        "border-border bg-card flex flex-col gap-2 rounded-xl border p-4",
        className,
      )}
    >
      <p className="text-muted-foreground text-sm">{date}</p>
      <p className="text-foreground">{trace.q}</p>
      <p className="text-foreground font-medium">{trace.a}</p>
    </article>
  );
}
