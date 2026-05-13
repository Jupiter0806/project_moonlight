import { useAppSelector } from "@/store/hooks";
import { CommonTraceProps } from "./types";
import {
  selectTraceById,
  selectTraceError,
  selectTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { QATrace as QATraceType } from "@/types/Trace";
import { AiAnswerDisplay } from "../ai-answer-display";
import { useRetryQaTrace } from "./hooks/useRetryQaTrace";

export function QATrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId)) as
    | QATraceType
    | undefined;

  const fetchStatus = useAppSelector(selectTraceFetchStatus(traceId));
  const fetchError = useAppSelector(selectTraceError(traceId));
  const handleRetry = useRetryQaTrace(trace);
  const shouldShowRetry =
    fetchStatus === "error" || trace?.qaAnswerStatus === "failed";

  if (!trace) return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle className="bg-primary-foreground">{trace.q}</CardTitle>
      </CardHeader>
      <CardContent className="min-h-24">
        <CardDescription>
          {trace.a && <AiAnswerDisplay answer={trace.a} />}
        </CardDescription>
        {fetchStatus === "loading" && (
          <p className="text-sm text-gray-500">{fetchStatus}</p>
        )}
        {shouldShowRetry && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            <span>{fetchError || "Failed to fetch answer."}</span>
            <button
              type="button"
              className="font-semibold underline"
              onClick={handleRetry}
            >
              Retry
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
