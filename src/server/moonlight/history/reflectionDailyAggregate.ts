import { FieldPath, type Firestore } from "firebase-admin/firestore";
import {
  parseMonthKey,
  resolveTimeZone,
  toDateKey,
} from "@/server/moonlight/history/shared";

function getNextMonthStartDateKey(monthKey: string): string {
  const [yearText, monthText] = monthKey.split("-");
  const year = Number(yearText);
  const month = Number(monthText);

  const nextMonthDate = new Date(Date.UTC(year, month - 1, 1));
  nextMonthDate.setUTCMonth(nextMonthDate.getUTCMonth() + 1);

  const nextYear = nextMonthDate.getUTCFullYear();
  const nextMonth = String(nextMonthDate.getUTCMonth() + 1).padStart(2, "0");
  return `${nextYear}-${nextMonth}-01`;
}

export function getReflectionDailyAggregateDocRef(
  db: Firestore,
  uid: string,
  requestedTimeZone: string | null,
  nowMs = Date.now(),
) {
  const timeZone = resolveTimeZone(requestedTimeZone);
  const dateKey = toDateKey(nowMs, timeZone);

  const ref = db
    .collection("moonlightReflectionDailyCounts")
    .doc(uid)
    .collection("daily")
    .doc(dateKey);

  return {
    ref,
    dateKey,
  };
}

export async function listReflectionAggregateDatesForMonth(
  db: Firestore,
  uid: string,
  monthKey: string | null,
): Promise<string[]> {
  const resolvedMonthKey = parseMonthKey(monthKey);
  const rangeStart = `${resolvedMonthKey}-01`;
  const rangeEnd = getNextMonthStartDateKey(resolvedMonthKey);

  const snapshot = await db
    .collection("moonlightReflectionDailyCounts")
    .doc(uid)
    .collection("daily")
    .where(FieldPath.documentId(), ">=", rangeStart)
    .where(FieldPath.documentId(), "<", rangeEnd)
    .get();

  return snapshot.docs
    .map((doc) => doc.id)
    .filter((id) => /^\d{4}-\d{2}-\d{2}$/.test(id));
}
