import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { buildMoonlightPrompt } from "@/server/moonlight/buildMoonlightPrompt";
import { fetchAnswer } from "@/server/chamber/fetchAnswer";
import {
  GenerateMoonlightHistoryError,
  ensureReflectionLinks,
  getDateWindow,
  listReflectionsInWindow,
  parseMoonlightDoc,
  resolveTimeZone,
  type GenerateMoonlightHistoryByDateResult,
} from "@/server/moonlight/history/shared";

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
