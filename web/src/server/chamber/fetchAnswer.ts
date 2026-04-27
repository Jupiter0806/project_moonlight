const QA_API_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent";

const QA_TIMEOUT_MS = 60_000;

interface GeminiResponse {
  candidates: {
    content: {
      parts: {
        text: string;
        thoughtSignature: string;
      }[];
      role: string;
    };
    finishReason: string;
    index: number;
  }[];
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
    promptTokensDetails: {
      modality: string;
      tokenCount: number;
    }[];
    thoughtsTokenCount: number;
  };
  modelVersion: string;
  responseId: string;
}

export async function fetchAnswer(question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), QA_TIMEOUT_MS);

  try {
    const response = await fetch(QA_API_BASE, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: question,
              },
            ],
          },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      let upstreamMessage = `Gemini request failed (${response.status})`;
      const contentType = response.headers.get("content-type");

      if (contentType?.includes("application/json")) {
        try {
          const errorBody = (await response.json()) as {
            error?: { message?: string };
          };
          upstreamMessage = errorBody.error?.message || upstreamMessage;
        } catch {
          // Keep the generic status-based message when parsing fails.
        }
      }

      throw new Error(upstreamMessage);
    }

    const data = (await response.json()) as GeminiResponse;
    if (!Array.isArray(data.candidates) || data.candidates.length === 0) {
      throw new Error("Gemini returned no candidates");
    }

    const answer = data.candidates
      .map((candidate) =>
        candidate.content.parts
          .map((part) => part.text)
          .filter((text): text is string => Boolean(text))
          .join("\n"),
      )
      .filter(Boolean)
      .join("\n");

    if (!answer.trim()) {
      throw new Error("Gemini returned an empty answer");
    }

    return answer;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Gemini request timed out");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
