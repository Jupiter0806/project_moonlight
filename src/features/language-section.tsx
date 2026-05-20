import { getLanguageName, LanguageKey } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { WithClassName } from "@/types/withClassName";
import { SpeechThis } from "./speech-this";
import { DictionaryThis } from "./dictionary-this";

export function LanguageSection({
  lang,
  value,
  className,
  showDictionary = true,
  traceId,
}: {
  lang: LanguageKey;
  value: string;
  showDictionary?: boolean;
  traceId?: string;
} & WithClassName) {
  // Chinese dictionary lookup is not implemented yet, so hide dictionary actions
  // for Chinese sections until the backend/data source is available.
  const canUseDictionary = showDictionary && lang !== "zh-CN";

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <p className="text-sm opacity-50">{getLanguageName(lang)}</p>
        <p className="text-xl font-medium">{value}</p>
      </div>
      <div className="flex gap-2">
        <SpeechThis text={value} language={lang} />
        {canUseDictionary && (
          <DictionaryThis text={value} language={lang} traceId={traceId} />
        )}
      </div>
    </div>
  );
}
