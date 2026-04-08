import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { LanguageKey } from "@/lib/languages";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/useIsMobile";

export function TranslateThis({
  sourceText,
  source,
  target,
  onResult,
}: {
  sourceText: string;
  source: LanguageKey;
  target: LanguageKey;
  onResult?: (result: string) => void;
}) {
  const isMobile = useIsMobile();
  const debounceDelay = isMobile ? 1000 : 400;
  const deferredSource = useDebounce(sourceText, debounceDelay);

  const { data, isLoading, error } = useQuery({
    queryKey: ["translate", deferredSource, source, target],
    queryFn: () => fetchTranslation(deferredSource!, source, target),
    enabled: Boolean(deferredSource),
    staleTime: Infinity, // Cache the translation effectively forever (since translation doesn't change)
    retry: false,
  });

  useEffect(() => {
    if (!error && data) {
      onResult?.(data);
    } else if (error) {
      onResult?.("");
      //   toast.error(`Translation failed. Please try again. (${error})`);
    }
  }, [data, error, onResult]);

  // todo
  // shimmer or skeleton for loading state?
  if (isLoading) return <span>Translating...</span>;

  return <span>{sourceText.length === 0 ? "" : data}</span>;
}

export async function fetchTranslation(
  text: string,
  sourceLang: string,
  targetLang: string,
): Promise<string> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, sourceLang, targetLang }),
  });
  if (!res.ok) throw new Error("Translation failed");
  const data = (await res.json()) as { translatedText: string };
  return data.translatedText;
}

export default TranslateThis;
