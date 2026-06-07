import { afterEach, describe, expect, it, vi } from "vitest";
import { getUsers } from "./users-service";

describe("users-service", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("deduplicates and fetches users in a single batch for <= 50 ids", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(
          JSON.stringify([
            { id: "u1", displayName: "User 1", email: "u1@example.com" },
            { id: "u2", displayName: "User 2", email: "u2@example.com" },
          ]),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          },
        ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const users = await getUsers(["u1", "u2", "u1", ""]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0]?.[0]).toContain("/api/users?userIds=u1,u2");
    expect(users).toHaveLength(2);
  });

  it("chunks user fetches when ids exceed 50", async () => {
    const fetchMock = vi.fn(
      async () =>
        new Response(JSON.stringify([]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
    );
    vi.stubGlobal("fetch", fetchMock);

    const ids = Array.from({ length: 55 }, (_, index) => `u${index + 1}`);
    await getUsers(ids);

    expect(fetchMock).toHaveBeenCalledTimes(2);

    const firstCallUrl = String(fetchMock.mock.calls[0]?.[0] ?? "");
    const secondCallUrl = String(fetchMock.mock.calls[1]?.[0] ?? "");

    const firstBatch = firstCallUrl.split("userIds=")[1]?.split(",") ?? [];
    const secondBatch = secondCallUrl.split("userIds=")[1]?.split(",") ?? [];

    expect(firstBatch).toHaveLength(50);
    expect(secondBatch).toHaveLength(5);
  });
});
