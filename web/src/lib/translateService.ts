const url =
  "https://translation.googleapis.com/language/translate/v2?key=" +
  process.env.GOOGLE_TRANSLATE_API_KEY;

import type { LanguageKey } from "@/lib/languages";

export async function translateText(
  text: string,
  sourceLang: LanguageKey,
  targetLang: LanguageKey,
): Promise<string> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: text,
      source: sourceLang,
      target: targetLang,
      format: "text",
    }),
  });

  if (!response.ok) {
    throw new Error("Translation API error");
  }

  const data = await response.json();
  return data.data.translations[0].translatedText as string;
}
