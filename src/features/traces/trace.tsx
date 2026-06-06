import type { WithClassName } from "@/types/withClassName";
import { QATrace } from "./qa-trace";
import { TranslateTrace } from "./translate-trace";
import { MarginaliaTrace } from "./marginalia-trace";
import type { URTEntryUI } from "@/store/types";
import { TraceReactionControls } from "./trace-reaction-controls";

interface TraceProps extends WithClassName {
  traceId: string;
  displayType: URTEntryUI["content"]["displayType"];
}

export function Trace({ traceId, displayType, className }: TraceProps) {
  let content: React.ReactNode = null;

  switch (displayType) {
    case "qa-trace":
      content = <QATrace traceId={traceId} className={className} />;
      break;
    case "translation-trace":
      content = <TranslateTrace traceId={traceId} className={className} />;
      break;
    case "marginalia-trace":
      content = <MarginaliaTrace traceId={traceId} className={className} />;
      break;
  }

  if (content) {
    return (
      <div>
        {content}

        <TraceReactionControls traceId={traceId} />
      </div>
    );
  }

  console.warn(`Unknown trace display type: ${displayType}`);
  return null;
}
