import {
  FieldValue,
  Timestamp,
  type Firestore,
} from "firebase-admin/firestore";
import { buildMoonlightPrompt } from "@/server/moonlight/buildMoonlightPrompt";
import { fetchAnswer } from "@/server/chamber/fetchAnswer";

type ReflectionLike = {
  id: string;
  summary: string;
};

export type MoonlightDoc = {
  id: string;
  uid: string;
  dayStartMs: number;
  dayEndMs: number;
  summary: string;
  reflectionIds: string[];
  reflectionCount: number;
};

type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export type GetTodayMoonlightResult = {
  exists: boolean;
  canRegenerate?: boolean;
  timeZone: string;
  dayStartMs: number;
  dayEndMs: number;
  reflectionCount: number;
  moonlight?: MoonlightDoc;
};

export type GenerateTodayMoonlightResult = {
  generated: boolean;
  canRegenerate?: boolean;
  moonlight: MoonlightDoc;
};

export class GenerateTodayMoonlightError extends Error {
  constructor(
    public readonly code: "NO_REFLECTIONS",
    message: string,
  ) {
    super(message);
    this.name = "GenerateTodayMoonlightError";
  }
}

function resolveTimeZone(requestedTimeZone: string | null): string {
  const fallback = "UTC";
  if (!requestedTimeZone) return fallback;

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: requestedTimeZone });
    return requestedTimeZone;
  } catch {
    return fallback;
  }
}

function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  const parts = formatter.formatToParts(date);
  const valueByType = new Map<string, string>();
  for (const part of parts) {
    valueByType.set(part.type, part.value);
  }

  return {
    year: Number(valueByType.get("year") ?? 0),
    month: Number(valueByType.get("month") ?? 1),
    day: Number(valueByType.get("day") ?? 1),
    hour: Number(valueByType.get("hour") ?? 0),
    minute: Number(valueByType.get("minute") ?? 0),
    second: Number(valueByType.get("second") ?? 0),
  };
}

function shiftYmd(year: number, month: number, day: number, shiftDays: number) {
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + shiftDays);

  return {
    year: utcDate.getUTCFullYear(),
    month: utcDate.getUTCMonth() + 1,
    day: utcDate.getUTCDate(),
  };
}

function getTimeZoneOffsetMs(utcMs: number, timeZone: string): number {
  const zoned = getZonedParts(new Date(utcMs), timeZone);
  const asUtcMs = Date.UTC(
    zoned.year,
    zoned.month - 1,
    zoned.day,
    zoned.hour,
    zoned.minute,
    zoned.second,
  );
  return asUtcMs - utcMs;
}

function zonedDateTimeToUtcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
  timeZone: string,
): number {
  const utcGuessMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const offsetMs = getTimeZoneOffsetMs(utcGuessMs, timeZone);
  let utcMs = utcGuessMs - offsetMs;

  const normalizedOffsetMs = getTimeZoneOffsetMs(utcMs, timeZone);
  if (normalizedOffsetMs !== offsetMs) {
    utcMs = utcGuessMs - normalizedOffsetMs;
  }

  return utcMs;
}

function getMoonlightWindow(timeZone: string, now = new Date()) {
  const nowInTz = getZonedParts(now, timeZone);
  const startDate =
    nowInTz.hour < 2
      ? shiftYmd(nowInTz.year, nowInTz.month, nowInTz.day, -1)
      : {
          year: nowInTz.year,
          month: nowInTz.month,
          day: nowInTz.day,
        };
  const endDate = shiftYmd(startDate.year, startDate.month, startDate.day, 1);

  const dayStartMs = zonedDateTimeToUtcMs(
    startDate.year,
    startDate.month,
    startDate.day,
    2,
    0,
    0,
    timeZone,
  );
  const dayEndMs = zonedDateTimeToUtcMs(
    endDate.year,
    endDate.month,
    endDate.day,
    2,
    0,
    0,
    timeZone,
  );

  return {
    dayStartMs,
    dayEndMs,
    timeZone,
  };
}

async function listTodayReflections(
  db: Firestore,
  uid: string,
  dayStartMs: number,
  dayEndMs: number,
): Promise<ReflectionLike[]> {
  const snapshot = await db
    .collection("reflections")
    .where("uid", "==", uid)
    .where("createdAt", ">=", Timestamp.fromMillis(dayStartMs))
    .where("createdAt", "<", Timestamp.fromMillis(dayEndMs))
    .orderBy("createdAt", "asc")
    .get();

  return snapshot.docs
    .map((doc) => doc.data() as Record<string, unknown>)
    .map((reflection) => {
      const id = typeof reflection.id === "string" ? reflection.id : "";
      const summary =
        typeof reflection.summary === "string" ? reflection.summary : "";

      return {
        id,
        summary,
      };
    })
    .filter((reflection) => reflection.id.length > 0);
}

function ensureReflectionLinks(
  summary: string,
  reflectionIds: string[],
): string {
  const missingIds = reflectionIds.filter(
    (id) => !summary.includes(`[reflection:${id}]`),
  );

  if (missingIds.length === 0) {
    return summary;
  }

  const suffix = missingIds.map((id) => `[reflection:${id}]`).join(" ");
  return `${summary.trim()}\n\n${suffix}`.trim();
}

function parseMoonlightDoc(data: Record<string, unknown>): MoonlightDoc {
  return {
    id: typeof data.id === "string" ? data.id : "",
    uid: typeof data.uid === "string" ? data.uid : "",
    dayStartMs:
      typeof data.dayStartMs === "number" && Number.isFinite(data.dayStartMs)
        ? data.dayStartMs
        : 0,
    dayEndMs:
      typeof data.dayEndMs === "number" && Number.isFinite(data.dayEndMs)
        ? data.dayEndMs
        : 0,
    summary: typeof data.summary === "string" ? data.summary : "",
    reflectionIds: Array.isArray(data.reflectionIds)
      ? data.reflectionIds.filter((id): id is string => typeof id === "string")
      : [],
    reflectionCount:
      typeof data.reflectionCount === "number" &&
      Number.isFinite(data.reflectionCount)
        ? data.reflectionCount
        : 0,
  };
}

export async function getTodayMoonlight(
  db: Firestore,
  uid: string,
  requestedTimeZone: string | null,
): Promise<GetTodayMoonlightResult> {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const { dayStartMs, dayEndMs } = getMoonlightWindow(timeZone);
  const dayKey = String(dayStartMs);

  const todayReflections = await listTodayReflections(
    db,
    uid,
    dayStartMs,
    dayEndMs,
  );

  const moonlightRef = db
    .collection("moonlight")
    .doc(uid)
    .collection("daily")
    .doc(dayKey);
  const moonlightSnap = await moonlightRef.get();

  if (!moonlightSnap.exists) {
    return {
      exists: false,
      timeZone,
      dayStartMs,
      dayEndMs,
      reflectionCount: todayReflections.length,
    };
  }

  const moonlight = parseMoonlightDoc(
    moonlightSnap.data() as Record<string, unknown>,
  );
  const canRegenerate = todayReflections.length > moonlight.reflectionCount;

  return {
    exists: true,
    canRegenerate,
    timeZone,
    dayStartMs,
    dayEndMs,
    reflectionCount: todayReflections.length,
    moonlight,
  };
}

export async function generateTodayMoonlight(
  db: Firestore,
  uid: string,
  requestedTimeZone: string | null,
): Promise<GenerateTodayMoonlightResult> {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const { dayStartMs, dayEndMs } = getMoonlightWindow(timeZone);
  const dayKey = String(dayStartMs);

  const reflections = await listTodayReflections(db, uid, dayStartMs, dayEndMs);
  if (reflections.length === 0) {
    throw new GenerateTodayMoonlightError(
      "NO_REFLECTIONS",
      "No reflections found for today's moonlight",
    );
  }

  const reflectionIds = reflections.map((reflection) => reflection.id);

  const moonlightRef = db
    .collection("moonlight")
    .doc(uid)
    .collection("daily")
    .doc(dayKey);

  const existingSnap = await moonlightRef.get();
  if (existingSnap.exists) {
    const existing = parseMoonlightDoc(
      existingSnap.data() as Record<string, unknown>,
    );
    const canRegenerate = reflections.length > existing.reflectionCount;

    if (!canRegenerate) {
      return {
        generated: false,
        canRegenerate: false,
        moonlight: existing,
      };
    }
  }

  const prompt = buildMoonlightPrompt(reflections);
  const rawSummary = await fetchAnswer(prompt);
  const summary = ensureReflectionLinks(rawSummary, reflectionIds);

  const moonlightPayload: Record<string, unknown> = {
    id: dayKey,
    uid,
    dayStartMs,
    dayEndMs,
    summary,
    reflectionIds,
    reflectionCount: reflectionIds.length,
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (!existingSnap.exists) {
    moonlightPayload.createdAt = FieldValue.serverTimestamp();
  }

  await moonlightRef.set(moonlightPayload, { merge: true });

  return {
    generated: true,
    moonlight: {
      id: dayKey,
      uid,
      dayStartMs,
      dayEndMs,
      summary,
      reflectionIds,
      reflectionCount: reflectionIds.length,
    },
  };
}
