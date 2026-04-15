import { getLanguageName, LanguageKey } from "@/lib/languages";
import { cn } from "@/lib/utils";
import { WithClassName } from "@/types/withClassName";
import { SpeechThis } from "./speech-this";
import { DictionaryThis } from "./dictionary-this";

export function LanguageSection({
  lang,
  value,
  className,
}: {
  lang: LanguageKey;
  value: string;
} & WithClassName) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      <div>
        <p className="text-sm opacity-50">{getLanguageName(lang)}</p>
        <p className="text-xl font-medium">{value}</p>
      </div>
      <div className="flex gap-2">
        <SpeechThis text={value} language={lang} />
        <DictionaryThis text={value} language={lang} />
      </div>
    </div>
  );
}
