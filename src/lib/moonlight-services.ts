import { Reflection } from "@/types/Reflection";

export async function getTodayReflections(
  direction: "top" | "bottom" | "new",
  cursor?: string,
): Promise<Reflection[]> {
  const qs = new URLSearchParams({
    direction: direction === "top" ? "top" : "bottom",
    limit: "20",
  });
  if (cursor) qs.set("cursor", cursor);

  const path = `/api/reflections/today?${qs.toString()}`;
  const url =
    typeof window !== "undefined"
      ? // why
        new URL(path, window.location.origin).toString()
      : `http://localhost${path}`;

  const res = await fetch(url);
  if (!res.ok) {
    const contentType = res.headers.get("content-type");
    let errorMessage = `Failed to fetch timeline (${res.status})`;

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
