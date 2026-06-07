import type { User } from "@/types/User";

export async function getUsers(userIds: string[]): Promise<User[]> {
  const ids = userIds.map((id) => id.trim()).filter(Boolean);
  if (ids.length === 0) {
    return [];
  }

  const path = `/api/users?userIds=${ids.join(",")}`;
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

export async function getUser(uid: string): Promise<User | undefined> {
  const users = await getUsers([uid]);
  return users[0];
}
