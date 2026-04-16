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
import { useAnswer } from "./hooks/useAnswer";
import { QATrace as QATraceType } from "@/types/Trace";
import { AiAnswerDisplay } from "../ai-answer-display";

export function QATrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId)) as
    | QATraceType
    | undefined;

  const fetchStatus = useAppSelector(selectTraceFetchStatus(traceId));
  const fetchError = useAppSelector(selectTraceError(traceId));

  useAnswer(trace);

  if (!trace) return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle className="bg-primary-foreground">{trace.q}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>
          {trace.a && <AiAnswerDisplay answer={trace.a} />}
        </CardDescription>
        {fetchStatus !== "done" && (
          <p className="text-sm text-gray-500">{fetchStatus}</p>
        )}
        {fetchStatus === "error" && (
          <p className="text-sm text-red-500">
            Failed to fetch answer. Please try again.
            {fetchError && ` Error: ${fetchError}`}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
