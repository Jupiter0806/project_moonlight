import { useAppSelector } from "@/store/hooks";
import { selectTraceById } from "@/store/slices/entitiesSlice";
import { CommonTraceProps } from "./types";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TranslateTrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));

  if (!trace) return null;

  const date = new Date(trace.created_at).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Card size="sm" className={cn(className)}>
      <CardHeader>
        <CardTitle>{trace.q}</CardTitle>
        <CardDescription>{date}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-foreground font-medium">{trace.a}</p>
      </CardContent>
    </Card>
  );
}
