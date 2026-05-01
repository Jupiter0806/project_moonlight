import { Timestamp } from "firebase-admin/firestore";
import { serializeFirestoreTimestamp } from "@/server/helpers/firestore-serialization";
import {
  DecodedPageCursor,
  ListParams,
  PageCursor,
} from "../types/pagination.types";

export function encodeCursor(cursor: PageCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): DecodedPageCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<PageCursor>;

    if (
      !parsed.createdAt ||
      typeof parsed.createdAt !== "object" ||
      typeof parsed.createdAt._seconds !== "number" ||
      !Number.isFinite(parsed.createdAt._seconds) ||
      typeof parsed.createdAt._nanoseconds !== "number" ||
      !Number.isFinite(parsed.createdAt._nanoseconds) ||
      typeof parsed.id !== "string" ||
      !parsed.id
    ) {
      console.warn("-- Invalid pagination cursor shape --", { cursor, parsed });
      return null;
    }

    return {
      createdAt: new Timestamp(
        parsed.createdAt._seconds,
        parsed.createdAt._nanoseconds,
      ),
      id: parsed.id,
    };
  } catch (error) {
    console.warn("-- Failed to decode pagination cursor --", { cursor, error });
    return null;
  }
}

export function buildPaginationBaseQuery<T>(
  ref: FirebaseFirestore.CollectionReference<T>,
  // for chamber traces, bottom is latest by default
  options?: { bottomLatest?: boolean },
) {
  const sortDirection = options?.bottomLatest ? "asc" : "desc";
  return ref.orderBy("createdAt", sortDirection).orderBy("id", sortDirection);
}

export function buildPaginationQuery<T>(
  ref: FirebaseFirestore.CollectionReference<T>,
  params: ListParams,
  // for chamber traces, bottom is latest by default
  options?: { bottomLatest?: boolean },
) {
  const baseQuery = buildPaginationBaseQuery(ref, options);

  const decodedCursor = params.cursor ? decodeCursor(params.cursor) : null;

  let query = baseQuery;
  if (decodedCursor) {
    if (params.direction === "top") {
      query = baseQuery
        .endBefore(decodedCursor.createdAt, decodedCursor.id)
        .limitToLast(params.limit);
    } else {
      query = baseQuery
        .startAfter(decodedCursor.createdAt, decodedCursor.id)
        .limit(params.limit);
    }
  } else if (params.direction === "bottom") {
    // Initial fetch returns the latest N traces while preserving ascending order.
    query = baseQuery.limit(params.limit);
  } else {
    query = baseQuery.limitToLast(params.limit);
  }

  return query;
}

/**
 * Builds opaque pagination cursors for a page of docs.
 *
 * `topCursor`    — points to the first doc in the page; only generated when
 *                  there are older docs above it (i.e. not returned when the
 *                  caller is already fetching the top / oldest page, or when
 *                  `direction === "bottom"`).
 *
 * `bottomCursor` — points to the last doc in the page; only generated when
 *                  there are newer docs below it (i.e. not returned when the
 *                  caller is already fetching the bottom / latest page, or when
 *                  `direction === "top"`).
 *
 * Either cursor being `undefined` signals "no more pages in that direction".
 */
export async function buildPaginationCursor<
  R,
  T extends { createdAt: unknown; id: string },
>(
  ref: FirebaseFirestore.CollectionReference<R>,
  docs: T[],
  options?: { bottomLatest?: boolean; direction?: ListParams["direction"] },
) {
  if (docs.length === 0)
    return {
      topCursor: undefined,
      bottomCursor: undefined,
    };

  const first = docs[0];
  const last = docs[docs.length - 1];

  const baseQuery = buildPaginationBaseQuery(ref, options);

  const olderCheck =
    options?.direction === "bottom"
      ? undefined
      : await baseQuery
          .endBefore(first.createdAt, first.id)
          .limitToLast(1)
          .get();
  const newerCheck =
    options?.direction === "top"
      ? undefined
      : await baseQuery.startAfter(last.createdAt, last.id).limit(1).get();

  return {
    topCursor:
      olderCheck === undefined || olderCheck.empty
        ? undefined
        : encodeCursor({
            createdAt: serializeFirestoreTimestamp(
              first.createdAt,
              "createdAt",
            ),
            id: first.id,
          }),
    bottomCursor:
      newerCheck === undefined || newerCheck.empty
        ? undefined
        : encodeCursor({
            createdAt: serializeFirestoreTimestamp(last.createdAt, "createdAt"),
            id: last.id,
          }),
  };
}
