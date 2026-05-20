import { useAppSelector } from "@/store/hooks";
import {
  selectTraceById,
  selectTraceError,
  selectTraceFetchStatus,
} from "@/store/slices/entitiesSlice";
import { CommonTraceProps } from "./types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageSection } from "@/features/language-section";
import { useRetryUpsertTranslateTrace } from "./hooks/useRetryUpsertTranslateTrace";

export function TranslateTrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));
  const fetchStatus = useAppSelector(selectTraceFetchStatus(traceId));
  const fetchError = useAppSelector(selectTraceError(traceId));

  const handleRetry = useRetryUpsertTranslateTrace(trace);

  if (!trace || trace.type === "qa") return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardContent>
        <LanguageSection
          lang={trace.sourceLang}
          value={trace.q}
          traceId={trace.id}
        />
        <Separator className="my-2" />
        <LanguageSection
          className="text-[#66D9EF]"
          lang={trace.targetLang}
          value={trace.a}
        />
        {trace.correction && (
          <p className="text-muted-foreground/75 mt-1 text-xs">
            Suggested correction: {trace.correction}
          </p>
        )}
        {
          // Current correction text is an English dictionary fallback until Chinese
          // dictionary support is available. Once Chinese corrections exist, this
          // low-attention inline text should be replaced with a dedicated UI.
        }

        {fetchStatus === "loading" && (
          <p className="mt-2 text-sm text-gray-500">Syncing to chamber...</p>
        )}

        {fetchStatus === "error" && (
          <div className="mt-2 flex items-center justify-between gap-2 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            <span>{fetchError || "Failed to sync trace."}</span>
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
