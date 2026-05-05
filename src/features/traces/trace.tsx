import type { WithClassName } from "@/types/withClassName";
import { QATrace } from "./qa-trace";
import { TranslateTrace } from "./translate-trace";
import type { URTEntryUI } from "@/store/types";

interface TraceProps extends WithClassName {
  traceId: string;
  displayType: URTEntryUI["content"]["displayType"];
}

export function Trace({ traceId, displayType, className }: TraceProps) {
  switch (displayType) {
    case "qa-trace":
      return <QATrace traceId={traceId} className={className} />;
    case "translation-trace":
      return <TranslateTrace traceId={traceId} className={className} />;
  }

  console.warn(`Unknown trace display type: ${displayType}`);
  return null;
}
