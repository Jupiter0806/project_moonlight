import { ListParams, PageCursor } from "../types/pagination.types";

export function encodeCursor(cursor: PageCursor): string {
  return Buffer.from(JSON.stringify(cursor), "utf8").toString("base64url");
}

export function decodeCursor(cursor: string): PageCursor | null {
  try {
    const parsed = JSON.parse(
      Buffer.from(cursor, "base64url").toString("utf8"),
    ) as Partial<PageCursor>;

    if (
      typeof parsed.createdAt !== "number" ||
      !Number.isFinite(parsed.createdAt) ||
      typeof parsed.id !== "string" ||
      !parsed.id
    ) {
      return null;
    }

    return { createdAt: parsed.createdAt, id: parsed.id };
  } catch {
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
    query = baseQuery.limitToLast(params.limit);
  } else {
    query = baseQuery.limitToLast(params.limit);
  }

  return query;
}

export async function buildPaginationCursor<
  R,
  T extends { createdAt: number; id: string },
>(
  ref: FirebaseFirestore.CollectionReference<R>,
  docs: T[], // for chamber traces, bottom is latest by default
  options?: { bottomLatest?: boolean },
) {
  if (docs.length === 0)
    return {
      topCursor: undefined,
      bottomCursor: undefined,
    };

  const first = docs[0];
  const last = docs[docs.length - 1];

  const baseQuery = buildPaginationBaseQuery(ref, options);

  const olderCheck = await baseQuery
    .endBefore(first.createdAt, first.id)
    .limitToLast(1)
    .get();
  const newerCheck = await baseQuery
    .startAfter(last.createdAt, last.id)
    .limit(1)
    .get();

  return {
    topCursor: olderCheck.empty
      ? undefined
      : encodeCursor({ createdAt: first.createdAt, id: first.id }),
    bottomCursor: newerCheck.empty
      ? undefined
      : encodeCursor({ createdAt: last.createdAt, id: last.id }),
  };
}
