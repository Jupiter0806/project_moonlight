import type { User } from "@/types/User";

const USERS_FETCH_BATCH_SIZE = 50;

function normalizeUserIds(userIds: string[]): string[] {
  return [...new Set(userIds.map((id) => id.trim()).filter(Boolean))].sort();
}

async function fetchUsersBatch(userIds: string[]): Promise<User[]> {
  const path = `/api/users?userIds=${userIds.join(",")}`;
  const url =
    typeof window !== "undefined"
      ? new URL(path, window.location.origin).toString()
      : `http://localhost${path}`;

  const res = await fetch(url);
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Failed to fetch users (${res.status})`;

    if (contentType?.includes("application/json")) {
      try {
        const data = (await res.json()) as { error?: string };
        errorMessage = data.error || errorMessage;
      } catch {
        // Ignore JSON parse failures so the HTTP status remains visible.
      }
    }

    throw new Error(errorMessage);
  }

  return await res.json();
}

export async function getUsers(userIds: string[]): Promise<User[]> {
  const ids = normalizeUserIds(userIds);
  if (ids.length === 0) {
    return [];
  }

  if (ids.length <= USERS_FETCH_BATCH_SIZE) {
    return await fetchUsersBatch(ids);
  }

  const chunks: string[][] = [];
  for (let i = 0; i < ids.length; i += USERS_FETCH_BATCH_SIZE) {
    chunks.push(ids.slice(i, i + USERS_FETCH_BATCH_SIZE));
  }

  const results = await Promise.all(
    chunks.map((chunk) => fetchUsersBatch(chunk)),
  );

  return results.flat();
}

export async function getUser(uid: string): Promise<User | undefined> {
  const users = await getUsers([uid]);
  return users[0];
}
