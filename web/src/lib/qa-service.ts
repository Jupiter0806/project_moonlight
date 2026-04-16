import { QAApiResponse } from "@/app/api/qa/route";

export async function fetchAnswer(question: string): Promise<string> {
  const res = await fetch("/api/qa", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ question }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = "Failed to fetch answer";

    if (contentType?.includes("application/json")) {
      try {
        const errorData = (await res.json()) as { error?: string };
        errorMessage = errorData.error || errorMessage;
      } catch {
        // Ignore JSON parse failures so the original HTTP error is not masked.
      }
    }

    throw new Error(errorMessage);
  }

  const data = (await res.json()) as QAApiResponse;

  return data.answers.join("\n");
}
