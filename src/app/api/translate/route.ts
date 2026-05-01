import { type NextRequest, NextResponse } from "next/server";
import { translateText } from "@/lib/translateService";
import type { LanguageKey } from "@/lib/languages";
import { translateRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";

interface TranslateRequestBody {
  text: string;
  sourceLang: LanguageKey;
  targetLang: LanguageKey;
}

export async function POST(request: NextRequest) {
  const key = await getRequestKey(request);
  const { success, limit, remaining, reset } =
    await translateRatelimit.limit(key);
  if (!success) {
    return NextResponse.json(
      { error: "Too many requests" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
          "Retry-After": String(Math.ceil((reset - Date.now()) / 1000)),
        },
      },
    );
  }

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
