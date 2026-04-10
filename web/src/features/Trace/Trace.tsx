import { useAppSelector } from "@/store/hooks";
import type { WithClassName } from "@/types/withClassName";
import { clsx } from "clsx";

interface TraceProps extends WithClassName {
  traceId: string;
}

export function Trace({ traceId, className }: TraceProps) {
  const trace = useAppSelector(
    (state) => state.entities.traces.entities[traceId],
  );

  const date = new Date(trace.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <article
      // use clsx
      className={clsx(
        "border-border bg-surface flex flex-col gap-2 rounded-xl border p-4",
        className,
      )}
    >
      <p className="text-muted text-sm">{date}</p>
      <p className="text-foreground">{trace.q}</p>
      <p className="text-foreground-strong font-medium">{trace.a}</p>
    </article>
  );
}
