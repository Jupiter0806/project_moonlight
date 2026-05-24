import { type Firestore } from "firebase-admin/firestore";
import {
  getMonthWindow,
  parseMonthKey,
  resolveTimeZone,
  toDateKey,
  type MoonlightHistoryDatesResult,
} from "@/server/moonlight/history/shared";

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
