import type { TranslationTrace } from "@/types/Trace";

interface UpsertChamberTraceResponse {
  status: "ok";
  traceId: string;
}

export async function upsertChamberTrace(
  trace: TranslationTrace,
): Promise<UpsertChamberTraceResponse> {
  const res = await fetch("/api/chamber/traces", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ trace }),
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let message = "Failed to sync trace";

    if (contentType?.includes("application/json")) {
      try {
        const data = (await res.json()) as { error?: string };
        message = data.error || message;
      } catch {
        // Ignore JSON parse failures so the original HTTP error is preserved.
      }
    }

    throw new Error(message);
  }

  return (await res.json()) as UpsertChamberTraceResponse;
}
