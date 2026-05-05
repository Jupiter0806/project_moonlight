import { serializeFirestoreTimestamp } from "@/server/helpers/firestore-serialization";
import {
  buildPaginationBaseQuery,
  decodeCursor,
  encodeCursor,
} from "@/server/helpers/pagination-helpers";
import type { ListParams } from "../types/pagination.types";

export { buildPaginationBaseQuery, decodeCursor, encodeCursor };

/**
 * V2 query builder for chamber traces.
 *
 * Key difference from v1: initial fetch (no cursor) uses `limitToLast(N)`
 * when `bottomLatest=true`, so the first page always shows the *latest* N
 * docs in ascending display order. v1 used `limit(N)`, which returned the
 * oldest N docs instead.
 */
export function buildPaginationQueryV2<T>(
  ref: FirebaseFirestore.CollectionReference<T>,
  params: ListParams,
  options?: { bottomLatest?: boolean },
) {
  const baseQuery = buildPaginationBaseQuery(ref, options);
  const decodedCursor = params.cursor ? decodeCursor(params.cursor) : null;

  if (decodedCursor) {
    if (params.direction === "top") {
      // Load older docs: everything before the cursor, newest-of-that-set first
      return baseQuery
        .endBefore(decodedCursor.createdAt, decodedCursor.id)
        .limitToLast(params.limit);
    }
    // direction=bottom (or updates poll): docs newer than cursor
    return baseQuery
      .startAfter(decodedCursor.createdAt, decodedCursor.id)
      .limit(params.limit);
  }

  // No cursor → initial fetch: latest N docs in ascending display order
  return baseQuery.limitToLast(params.limit);
}

export interface PaginationCursorV2 {
  /** Boundary cursor pointing to the first (oldest) doc in the page. null if page is empty. */
  topCursor: string | null;
  /** Boundary cursor pointing to the last (newest) doc in the page. null if page is empty. */
  bottomCursor: string | null;
  /** True when there are older docs above the current page. */
  hasMoreTop: boolean;
  /** True when there are newer docs below the current page. */
  hasMoreBottom: boolean;
}

/**
 * V2 pagination cursor builder — always emits boundary cursors.
 *
 * Unlike v1, cursors represent the page boundary regardless of whether more
 * pages exist. `hasMoreTop`/`hasMoreBottom` carry that signal separately.
 * Returns `null` cursors only when the page is empty (no anchor doc exists).
 *
 * Both Firestore checks run in parallel.
 */
export async function buildPaginationCursorV2<
  R,
  T extends { createdAt: unknown; id: string },
>(
  ref: FirebaseFirestore.CollectionReference<R>,
  docs: T[],
  options?: { bottomLatest?: boolean },
): Promise<PaginationCursorV2> {
  if (docs.length === 0) {
    return {
      topCursor: null,
      bottomCursor: null,
      hasMoreTop: false,
      hasMoreBottom: false,
    };
  }

  const first = docs[0];
  const last = docs[docs.length - 1];
  const baseQuery = buildPaginationBaseQuery(ref, options);

  const [olderCheck, newerCheck] = await Promise.all([
    baseQuery.endBefore(first.createdAt, first.id).limitToLast(1).get(),
    baseQuery.startAfter(last.createdAt, last.id).limit(1).get(),
  ]);

  return {
    topCursor: buildCursor(first),
    bottomCursor: buildCursor(last),
    hasMoreTop: !olderCheck.empty,
    hasMoreBottom: !newerCheck.empty,
  };
}

export function buildCursor<T extends { createdAt: unknown; id: string }>(
  doc: T,
) {
  return encodeCursor({
    createdAt: serializeFirestoreTimestamp(doc.createdAt, "createdAt"),
    id: doc.id,
  });
}
