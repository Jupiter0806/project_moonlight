const url =
  "https://translation.googleapis.com/language/translate/v2?key=" +
  process.env.GOOGLE_TRANSLATE_API_KEY;

import type { LanguageKey } from "@/lib/languages";

// todo
// could google api return back the source language for spell checking? if not, we might want to detect language first before translating
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
