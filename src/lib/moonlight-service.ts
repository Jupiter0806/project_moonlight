export interface MoonlightData {
  id: string;
  summary: string;
  reflectionIds: string[];
  reflectionCount: number;
}

export interface GetTodayMoonlightResponse {
  status: "ok";
  exists: boolean;
  moonlight?: MoonlightData;
  canRegenerate?: boolean;
  timeZone: string;
  dayStartMs: number;
  dayEndMs: number;
  reflectionCount: number;
}

export interface GenerateTodayMoonlightResponse {
  status: "ok";
  generated: boolean;
  canRegenerate?: boolean;
  moonlight: MoonlightData;
}

export interface GetMoonlightDatesResponse {
  status: "ok";
  month: string;
  availableDates: string[];
}

function getUserTimeZone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  const contentType = response.headers.get("content-type");
  if (contentType?.includes("application/json")) {
    try {
      const data = (await response.json()) as { error?: string };
      if (data.error) {
        return data.error;
      }
    } catch {
      // Keep fallback.
    }
  }

  return fallback;
}

export async function getTodayMoonlight(): Promise<GetTodayMoonlightResponse> {
  const response = await fetch("/api/moonlight/today", {
    method: "GET",
    headers: {
      "x-user-timezone": getUserTimeZone(),
    },
  });

  if (!response.ok) {
    const message = await readApiError(
      response,
      "Failed to load today's moonlight",
    );
    throw new Error(message);
  }

  return (await response.json()) as GetTodayMoonlightResponse;
}

export async function generateTodayMoonlight(): Promise<GenerateTodayMoonlightResponse> {
  const response = await fetch("/api/moonlight/today", {
    method: "POST",
    headers: {
      "x-user-timezone": getUserTimeZone(),
    },
  });

  if (!response.ok) {
    const message = await readApiError(
      response,
      "Failed to generate today's moonlight",
    );
    throw new Error(message);
  }

  return (await response.json()) as GenerateTodayMoonlightResponse;
}

export async function getMoonlightDates(
  month: string,
  signal?: AbortSignal,
): Promise<GetMoonlightDatesResponse> {
  const response = await fetch(`/api/moonlight/dates?month=${month}`, {
    method: "GET",
    signal,
  });

  if (!response.ok) {
    const message = await readApiError(
      response,
      "Failed to load moonlight history dates",
    );
    throw new Error(message);
  }

  return (await response.json()) as GetMoonlightDatesResponse;
}
