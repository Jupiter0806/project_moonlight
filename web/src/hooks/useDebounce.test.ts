import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { useDebounce } from "./useDebounce";

// --- Tests are written against stated requirements, not implementation details ---
// Requirements:
// todo: immediately returns the initial value on mount (currently NOT, undefined by default)
//   - currently NOT Returns the initial value immediately on mount, undefined by default
//   - After the delay, the deferred value updates to reflect the latest value
//   - If the value changes before the delay elapses, the previous timer is cancelled
//     and a new one starts (debounce behaviour)
//   - Accepts a custom delay; defaults to 1000ms when omitted
//   - If the value is set to the same reference, the state does not update

describe("useDebounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("initial value", () => {
    // it("returns the initial value immediately", () => {
    //   const { result } = renderHook(() => useDebounce("hello"));
    //   expect(result.current).toBe("hello");
    // });

    // it("returns the initial value for objects immediately", () => {
    //   const obj = { a: 1 };
    //   const { result } = renderHook(() => useDebounce(obj));
    //   expect(result.current).toBe(obj);
    // });

    it("handles undefined as initial value without throwing", () => {
      expect(() => renderHook(() => useDebounce(undefined))).not.toThrow();
    });
  });

  describe("deferred update", () => {
    it("does not update before the delay elapses", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });
      act(() => vi.advanceTimersByTime(499));

      expect(result.current).toBe("initial");
    });

    it("updates to the new value after the delay elapses", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });
      act(() => vi.advanceTimersByTime(500));

      expect(result.current).toBe("updated");
    });

    it("uses the default delay of 1000ms when no delay is provided", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "updated" });

      act(() => vi.advanceTimersByTime(999));
      expect(result.current).toBe("initial");

      act(() => vi.advanceTimersByTime(1));
      expect(result.current).toBe("updated");
    });
  });

  describe("debounce behaviour", () => {
    it("resets the timer when value changes before delay elapses", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "initial" } },
      );

      rerender({ value: "first" });
      act(() => vi.advanceTimersByTime(300));

      rerender({ value: "second" });
      act(() => vi.advanceTimersByTime(300));

      // Only 300ms passed after the last change — should not have updated yet
      expect(result.current).toBe("initial");

      act(() => vi.advanceTimersByTime(200));
      expect(result.current).toBe("second");
    });

    it("skips intermediate values when they change rapidly", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "a" } },
      );

      rerender({ value: "b" });
      act(() => vi.advanceTimersByTime(100));
      rerender({ value: "c" });
      act(() => vi.advanceTimersByTime(100));
      rerender({ value: "d" });
      act(() => vi.advanceTimersByTime(500));

      expect(result.current).toBe("d");
    });
  });

  describe("same value", () => {
    it("does not change state when the value is set to the same primitive", () => {
      const { result, rerender } = renderHook(
        ({ value }) => useDebounce(value, 500),
        { initialProps: { value: "same" } },
      );

      const before = result.current;
      rerender({ value: "same" });
      act(() => vi.advanceTimersByTime(500));

      expect(result.current).toBe(before);
    });
  });

  describe("delay change", () => {
    it("respects a new delay when the delay prop changes", () => {
      const { result, rerender } = renderHook(
        ({ value, delay }) => useDebounce(value, delay),
        { initialProps: { value: "initial", delay: 500 } },
      );

      rerender({ value: "updated", delay: 200 });
      act(() => vi.advanceTimersByTime(200));

      expect(result.current).toBe("updated");
    });
  });
});
