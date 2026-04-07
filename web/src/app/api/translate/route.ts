import { type NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translateService";
import type { LanguageKey } from "@/lib/languages";

interface TranslateRequestBody {
  text: string;
  sourceLang: LanguageKey;
  targetLang: LanguageKey;
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as Partial<TranslateRequestBody>;

  if (!body.text || !body.sourceLang || !body.targetLang) {
    return NextResponse.json(
      { error: "text, sourceLang and targetLang are required" },
      { status: 400 },
    );
  }

  try {
    const translatedText = await translateText(
      body.text,
      body.sourceLang,
      body.targetLang,
    );
    return NextResponse.json({ translatedText });
  } catch {
    return NextResponse.json({ error: "Translation failed" }, { status: 502 });
  }
}
