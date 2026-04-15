import { useAppSelector } from "@/store/hooks";
import { selectTraceById } from "@/store/slices/entitiesSlice";
import { CommonTraceProps } from "./types";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LanguageSection } from "@/features/language-section";

export function TranslateTrace({ traceId, className }: CommonTraceProps) {
  const trace = useAppSelector((state) => selectTraceById(state, traceId));

  if (!trace || trace.type === "qa") return null;

  return (
    <Card size="sm" className={cn(className)}>
      <CardContent>
        <LanguageSection lang={trace.sourceLang} value={trace.q} />
        <Separator className="my-2" />
        <LanguageSection
          className="text-[#66D9EF]"
          lang={trace.targetLang}
          value={trace.a}
        />
      </CardContent>
    </Card>
  );
}
