import { getRequestKey } from "@/lib/getRequestKey";
import { speechRatelimit } from "@/lib/rateLimit";
import { NextRequest, NextResponse } from "next/server";

const SPEECH_API_BASE = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${process.env.GOOGLE_TRANSLATE_API_KEY}`;

/**
 * GET /api/speech/[text]?languageCode=zh-CN
 *
 * Converts the given text to an MP3 audio clip using Google Text-to-Speech.
 *
 * Path params:
 *   text          — The text to synthesize (URL-encoded).
 *
 * Query params:
 *   languageCode  — BCP-47 language code for the voice (e.g. "en", "zh-CN").
 *                   Defaults to "en" if omitted.
 *
 * Returns:
 *   The raw base64-encoded MP3 audio content string from the Google TTS API.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ text: string }> },
) {
  const key = await getRequestKey(request);
  const { success, limit, remaining, reset } = await speechRatelimit.limit(key);
  if (!success) {
    // might need to a common response
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

  const { text } = await params;
  const languageCode = request.nextUrl.searchParams.get("languageCode") ?? "en";

  const response = await fetch(SPEECH_API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: { text },
      voice: { languageCode: languageCode, ssmlGender: "NEUTRAL" },
      audioConfig: { audioEncoding: "MP3" },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Speech API error details:", errorData);
    throw new Error("Text-to-Speech API error");
  }

  const data = await response.json();
  return NextResponse.json({ audioContent: data.audioContent as string });
}
