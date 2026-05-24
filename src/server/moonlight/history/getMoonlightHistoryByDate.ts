import { type Firestore } from "firebase-admin/firestore";
import {
  getDateWindow,
  listReflectionsInWindow,
  parseMoonlightDoc,
  resolveTimeZone,
  type MoonlightHistoryMoonlightResult,
} from "@/server/moonlight/history/shared";

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
