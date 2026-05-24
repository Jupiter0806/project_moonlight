import { TimelineApiResponse } from "@/store/types";
import type { Trace } from "@/types/Trace";

interface UpsertChamberTraceResponse {
  status: "ok";
  traceId: string;
  cursor: string;

  // only returned for QA traces when answer is generated synchronously by the API;
  answer?: string;
}

interface UpdateTraceLikedResponse {
  status: "ok";
  traceId: string;
  liked: boolean | null;
}

interface UpdateTraceCorrectionResponse {
  status: "ok";
  traceId: string;
  correction: string | null;
}

type QaTraceStreamEvent =
  | { type: "chunk"; delta: string }
  | { type: "done" }
  | { type: "error"; message: string };

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

export async function streamQaTraceAnswer(
  traceId: string,
  onChunk: (delta: string) => void,
  signal?: AbortSignal,
): Promise<void> {
  const res = await fetch(
    `/api/chamber/traces/${encodeURIComponent(traceId)}/qa-stream`,
    {
      method: "POST",
      signal,
    },
  );

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let message = "Failed to stream QA trace answer";

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

  if (!res.body) {
    throw new Error("QA stream response body is empty");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const handleLine = (line: string): boolean => {
    if (!line.trim()) return false;

    const event = JSON.parse(line) as QaTraceStreamEvent;
    if (event.type === "chunk") {
      onChunk(event.delta);
      return false;
    }

    if (event.type === "error") {
      throw new Error(event.message || "Failed to stream QA trace answer");
    }

    return event.type === "done";
  };

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      if (handleLine(line)) {
        return;
      }
    }
  }

  buffer += decoder.decode();
  if (buffer.trim()) {
    handleLine(buffer);
  }
}

export async function updateTraceLiked(
  traceId: string,
  liked: boolean | null,
  signal?: AbortSignal,
): Promise<UpdateTraceLikedResponse> {
  const res = await fetch(
    `/api/chamber/traces/${encodeURIComponent(traceId)}/liked`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ liked }),
      signal,
    },
  );

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let message = "Failed to update trace reaction";

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

  return (await res.json()) as UpdateTraceLikedResponse;
}

export async function updateTranslationTraceCorrection(
  traceId: string,
  correction: string | null,
  signal?: AbortSignal,
): Promise<UpdateTraceCorrectionResponse> {
  const res = await fetch(
    `/api/chamber/traces/${encodeURIComponent(traceId)}/correction`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ correction }),
      signal,
    },
  );

  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let message = "Failed to update translation correction";

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

  return (await res.json()) as UpdateTraceCorrectionResponse;
}

export async function flushChamberTraces(): Promise<{
  status: "ok";
  reflectionId: string;
  traceIds: string[];
  summary: string;
  summaryGenerated: boolean;
}> {
  const userTimeZone = (() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
    } catch {
      return "UTC";
    }
  })();

  const res = await fetch("/api/chamber/traces/flush", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-user-timezone": userTimeZone,
    },
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

export async function getChamberTraces(
  direction: "top" | "bottom" | "new",
  cursor?: string,
): Promise<TimelineApiResponse> {
  const qs = new URLSearchParams({
    direction: direction === "top" ? "top" : "bottom",
    limit: "20",
  });
  if (cursor) qs.set("cursor", cursor);

  const path = `/api/chamber/traces?${qs.toString()}`;
  const url =
    typeof window !== "undefined"
      ? // why
        new URL(path, window.location.origin).toString()
      : `http://localhost${path}`;

  const res = await fetch(url);
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Failed to fetch timeline (${res.status})`;

    if (contentType?.includes("application/json")) {
      try {
        const data = (await res.json()) as { error?: string };
        errorMessage = data.error || errorMessage;
      } catch {
        // Ignore JSON parse failures so the HTTP status remains visible.
      }
    }

    throw new Error(errorMessage);
  }

  return await res.json();
}

export async function getChamberUpdates(
  cursor?: string,
  waitMs = 8000,
  signal?: AbortSignal,
): Promise<TimelineApiResponse> {
  const qs = new URLSearchParams({
    limit: "20",
    waitMs: String(Math.max(1000, Math.min(15000, Math.trunc(waitMs)))),
    direction: "bottom",
  });
  if (cursor) qs.set("cursor", cursor);

  const path = `/api/chamber/updates?${qs.toString()}`;
  const url =
    typeof window !== "undefined"
      ? new URL(path, window.location.origin).toString()
      : `http://localhost${path}`;

  const res = await fetch(url, { signal });
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Failed to fetch updates (${res.status})`;

    if (contentType?.includes("application/json")) {
      try {
        const data = (await res.json()) as { error?: string };
        errorMessage = data.error || errorMessage;
      } catch {
        // Ignore JSON parse failures so the HTTP status remains visible.
      }
    }

    throw new Error(errorMessage);
  }

  return await res.json();
}
