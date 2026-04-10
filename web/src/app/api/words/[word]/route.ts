import { type NextRequest, NextResponse } from "next/server";
import type { WordResult } from "@/lib/wordsService";
import { wordsRatelimit } from "@/lib/rateLimit";
import { getRequestKey } from "@/lib/getRequestKey";

const WORDS_API_BASE = "https://wordsapiv1.p.rapidapi.com/words";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ word: string }> },
) {
  const key = await getRequestKey(request);
  const { success, limit, remaining, reset } = await wordsRatelimit.limit(key);
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

  const { word } = await params;

  const apiKey = process.env.WORDS_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Words API key not configured" },
      { status: 500 },
    );
  }

  const encoded = encodeURIComponent(word);

  const res = await fetch(`${WORDS_API_BASE}/${encoded}`, {
    headers: {
      "x-rapidapi-key": apiKey,
      "x-rapidapi-host": "wordsapiv1.p.rapidapi.com",
    },
  });

  if (res.status === 404) {
    return NextResponse.json({ error: "Word not found" }, { status: 404 });
  }

  if (!res.ok) {
    return NextResponse.json(
      { error: "Failed to fetch word data" },
      { status: 502 },
    );
  }

  const data = (await res.json()) as WordResult;

  return NextResponse.json<WordResult>({
    word,
    results: data.results ?? [],
  });
}
