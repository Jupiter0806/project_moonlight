import { List } from "@/components/list";
import { Trace } from "./trace";
import { URTEntry } from "@/store/thunks/fetchTimelineThunk";

export function TraceList({
  entries,
  isLoading,
}: {
  entries: URTEntry[];
  isLoading: boolean;
}) {
  return (
    <List isLoading={isLoading}>
      {entries.map((entry) => (
        <Trace
          key={entry.entryId}
          traceId={entry.content.id}
          displayType={entry.content.displayType}
        />
      ))}
    </List>
  );
}
