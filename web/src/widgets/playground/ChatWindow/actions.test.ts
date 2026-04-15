import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendMessageAction, type ChatActionState } from "./actions";

describe("sendMessageAction", () => {
  const initialState: ChatActionState = {
    messages: [{ id: 1, text: "existing" }],
    error: null,
    lastAttempt: null,
    attemptCount: 0,
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("appends message and clears retry state on success", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.1);
    const formData = new FormData();
    formData.set("message", "Hello Moonlight");

    const promise = sendMessageAction(initialState, formData);
    await vi.advanceTimersByTimeAsync(1000);
    const result = await promise;

    expect(result.messages).toHaveLength(2);
    expect(result.messages[1]?.text).toBe("Hello Moonlight");
    expect(result.error).toBeNull();
    expect(result.lastAttempt).toBeNull();
    expect(result.attemptCount).toBe(0);
  });

  it("returns retry state on failure", async () => {
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    const formData = new FormData();
    formData.set("message", "Retry me");

    const result = await sendMessageAction(
      { ...initialState, attemptCount: 2 },
      formData,
    );

    expect(result.messages).toEqual(initialState.messages);
    expect(result.error).toBe("Database Timeout");
    expect(result.lastAttempt).toBe("Retry me");
    expect(result.attemptCount).toBe(3);
  });
});
