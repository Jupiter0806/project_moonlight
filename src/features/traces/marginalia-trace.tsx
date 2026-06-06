import { useAppSelector } from "@/store/hooks";
import {
  selectTraceById,
  selectTraceError,
  selectTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import { CommonTraceProps } from "./types";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function MarginaliaTrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));
  const fetchStatus = useAppSelector(selectTraceFetchStatus(traceId));
  const fetchError = useAppSelector(selectTraceError(traceId));

  if (!trace || trace.type !== "marginalia") return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle className="bg-primary-foreground whitespace-pre-wrap">
          {trace.q}
        </CardTitle>
      </CardHeader>
      {fetchStatus === "loading" && (
        <CardContent>
          <p className="text-sm text-gray-500">Syncing to chamber...</p>
        </CardContent>
      )}
      {fetchStatus === "error" && (
        <CardContent>
          <p className="text-sm text-red-600">
            {fetchError || "Failed to sync trace."}
          </p>
        </CardContent>
      )}
    </Card>
  );
}
