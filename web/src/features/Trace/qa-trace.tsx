import { useAppSelector } from "@/store/hooks";
import { CommonTraceProps } from "./types";
import { selectTraceById } from "@/store/slices/entitiesSlice";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function QATrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));

  if (!trace) return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle>{trace.q}</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{trace.a}</CardDescription>
      </CardContent>
    </Card>
  );
}
