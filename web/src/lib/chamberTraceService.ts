import type { Trace } from "@/types/Trace";

interface UpsertChamberTraceResponse {
  status: "ok";
  traceId: string;

  // only returned for QA traces when answer is generated synchronously by the API;
  answer?: string;
}

export async function upsertChamberTrace(
  trace: Trace,
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

export async function flushChamberTraces(): Promise<{
  status: "ok";
  reflectionId: string;
  traceIds: string[];
  summary: string;
  summaryGenerated: boolean;
}> {
  const res = await fetch("/api/chamber/traces/flush", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let message = "Failed to flush chamber traces";

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

  return (await res.json()) as {
    status: "ok";
    reflectionId: string;
    traceIds: string[];
    summary: string;
    summaryGenerated: boolean;
  };
}
