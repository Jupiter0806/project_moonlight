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

type MoonlightDoc = {
  id: string;
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

export type MoonlightHistoryDatesResult = {
  month: string;
  availableDates: string[];
};

export type MoonlightHistoryMoonlightResult = {
  date: string;
  exists: boolean;
  canGenerate: boolean;
  moonlight?: MoonlightDoc;
};

export type GenerateMoonlightHistoryByDateResult = {
  date: string;
  generated: boolean;
  moonlight: MoonlightDoc;
};

export class GenerateMoonlightHistoryError extends Error {
  constructor(
    public readonly code: "NO_REFLECTIONS",
    message: string,
  ) {
    super(message);
    this.name = "GenerateMoonlightHistoryError";
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

function parseMonthKey(monthKey: string | null): string {
  if (monthKey && /^\d{4}-\d{2}$/.test(monthKey)) {
    return monthKey;
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function parseDateKey(dateKey: string): {
  year: number;
  month: number;
  day: number;
} {
  const [yearText, monthText, dayText] = dateKey.split("-");
  return {
    year: Number(yearText),
    month: Number(monthText),
    day: Number(dayText),
  };
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

function toDateKey(ms: number, timeZone: string): string {
  const zoned = getZonedParts(new Date(ms), timeZone);
  return `${zoned.year}-${String(zoned.month).padStart(2, "0")}-${String(zoned.day).padStart(2, "0")}`;
}

function getDateWindow(dateKey: string, timeZone: string) {
  const { year, month, day } = parseDateKey(dateKey);
  const dayStartMs = zonedDateTimeToUtcMs(year, month, day, 2, 0, 0, timeZone);

  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + 1);

  const dayEndMs = zonedDateTimeToUtcMs(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    2,
    0,
    0,
    timeZone,
  );

  return { dayStartMs, dayEndMs, dayKey: String(dayStartMs) };
}

function getMonthWindow(monthKey: string, timeZone: string) {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const monthStartMs = zonedDateTimeToUtcMs(year, month, 1, 0, 0, 0, timeZone);

  const nextMonthDate = new Date(Date.UTC(year, month - 1, 1));
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);

  const monthEndMs = zonedDateTimeToUtcMs(
    nextMonthDate.getUTCFullYear(),
    nextMonthDate.getUTCMonth() + 1,
    1,
    0,
    0,
    0,
    timeZone,
  );

  return { monthStartMs, monthEndMs };
}

function parseMoonlightDoc(data: Record<string, unknown>): MoonlightDoc {
  return {
    id: typeof data.id === "string" ? data.id : "",
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

async function listReflectionsInWindow(
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
    .map((reflection) => ({
      id: typeof reflection.id === "string" ? reflection.id : "",
      summary: typeof reflection.summary === "string" ? reflection.summary : "",
    }))
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

export async function listMoonlightHistoryDates(
  db: Firestore,
  uid: string,
  monthKey: string | null,
  requestedTimeZone: string | null,
): Promise<MoonlightHistoryDatesResult> {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const resolvedMonthKey = parseMonthKey(monthKey);
  const { monthStartMs, monthEndMs } = getMonthWindow(
    resolvedMonthKey,
    timeZone,
  );

  const snapshot = await db
    .collection("moonlight")
    .doc(uid)
    .collection("daily")
    .where("dayStartMs", ">=", monthStartMs)
    .where("dayStartMs", "<", monthEndMs)
    .orderBy("dayStartMs", "asc")
    .get();

  const availableDates = Array.from(
    new Set(
      snapshot.docs
        .map((doc) => {
          const data = doc.data() as Record<string, unknown>;
          const dayStartMs = data.dayStartMs;
          if (typeof dayStartMs !== "number" || !Number.isFinite(dayStartMs)) {
            return null;
          }
          return toDateKey(dayStartMs, timeZone);
        })
        .filter((date): date is string => date !== null),
    ),
  );

  return {
    month: resolvedMonthKey,
    availableDates,
  };
}

export async function getMoonlightHistoryByDate(
  db: Firestore,
  uid: string,
  dateKey: string,
  requestedTimeZone: string | null,
): Promise<MoonlightHistoryMoonlightResult> {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const { dayStartMs, dayEndMs, dayKey } = getDateWindow(dateKey, timeZone);

  const moonlightRef = db
    .collection("moonlight")
    .doc(uid)
    .collection("daily")
    .doc(dayKey);
  const moonlightSnap = await moonlightRef.get();

  if (moonlightSnap.exists) {
    return {
      date: dateKey,
      exists: true,
      canGenerate: false,
      moonlight: parseMoonlightDoc(
        moonlightSnap.data() as Record<string, unknown>,
      ),
    };
  }

  const reflections = await listReflectionsInWindow(
    db,
    uid,
    dayStartMs,
    dayEndMs,
  );

  return {
    date: dateKey,
    exists: false,
    canGenerate: reflections.length > 0,
  };
}

export async function generateMoonlightHistoryByDate(
  db: Firestore,
  uid: string,
  dateKey: string,
  requestedTimeZone: string | null,
): Promise<GenerateMoonlightHistoryByDateResult> {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const { dayStartMs, dayEndMs, dayKey } = getDateWindow(dateKey, timeZone);

  const moonlightRef = db
    .collection("moonlight")
    .doc(uid)
    .collection("daily")
    .doc(dayKey);
  const existingSnap = await moonlightRef.get();

  if (existingSnap.exists) {
    return {
      date: dateKey,
      generated: false,
      moonlight: parseMoonlightDoc(
        existingSnap.data() as Record<string, unknown>,
      ),
    };
  }

  const reflections = await listReflectionsInWindow(
    db,
    uid,
    dayStartMs,
    dayEndMs,
  );
  if (reflections.length === 0) {
    throw new GenerateMoonlightHistoryError(
      "NO_REFLECTIONS",
      "No reflections, unable to generate.",
    );
  }

  const reflectionIds = reflections.map((reflection) => reflection.id);
  const rawSummary = await fetchAnswer(buildMoonlightPrompt(reflections));
  const summary = ensureReflectionLinks(rawSummary, reflectionIds);

  await moonlightRef.set(
    {
      id: dayKey,
      uid,
      dayStartMs,
      dayEndMs,
      summary,
      reflectionIds,
      reflectionCount: reflectionIds.length,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true },
  );

  return {
    date: dateKey,
    generated: true,
    moonlight: {
      id: dayKey,
      summary,
      reflectionIds,
      reflectionCount: reflectionIds.length,
    },
  };
}
