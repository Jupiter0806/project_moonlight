import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useIsMobile } from "./useIsMobile";

// --- Tests are written against stated requirements, not implementation details ---
// Requirements:
//   - Returns false by default (SSR-safe, assumes desktop)
//   - Returns true when viewport matches the mobile breakpoint (max-width: 768px)
//   - Updates reactively when viewport crosses the breakpoint
//   - Cleans up the event listener on unmount

type MockMql = {
  matches: boolean;
  addEventListener: ReturnType<typeof vi.fn>;
  removeEventListener: ReturnType<typeof vi.fn>;
  _trigger: (matches: boolean) => void;
};

function createMockMql(matches: boolean): MockMql {
  const listeners: Array<(e: Partial<MediaQueryListEvent>) => void> = [];
  return {
    matches,
    addEventListener: vi.fn((_, fn) => listeners.push(fn)),
    removeEventListener: vi.fn(),
    _trigger: (newMatches: boolean) =>
      listeners.forEach((l) => l({ matches: newMatches })),
  };
}

describe("useIsMobile", () => {
  let mockMql: MockMql;

  beforeEach(() => {
    mockMql = createMockMql(false);
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockReturnValue(mockMql),
    });
  });

  describe("initial value", () => {
    it("returns false (desktop) when viewport does not match the mobile query", () => {
      mockMql.matches = false;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(false);
    });

    it("returns true (mobile) when viewport matches the mobile query on mount", () => {
      mockMql.matches = true;
      const { result } = renderHook(() => useIsMobile());
      expect(result.current).toBe(true);
    });

    it("queries the correct breakpoint (max-width: 768px)", () => {
      renderHook(() => useIsMobile());
      expect(window.matchMedia).toHaveBeenCalledWith("(max-width: 768px)");
    });
  });

  describe("reactive updates", () => {
    it("updates to true when viewport shrinks to mobile", () => {
      mockMql.matches = false;
      const { result } = renderHook(() => useIsMobile());

      act(() => mockMql._trigger(true));

      expect(result.current).toBe(true);
    });

    it("updates to false when viewport grows to desktop", () => {
      mockMql.matches = true;
      const { result } = renderHook(() => useIsMobile());

      act(() => mockMql._trigger(false));

      expect(result.current).toBe(false);
    });
  });

  describe("cleanup", () => {
    it("removes the event listener on unmount", () => {
      const { unmount } = renderHook(() => useIsMobile());
      unmount();
      expect(mockMql.removeEventListener).toHaveBeenCalledOnce();
    });
  });
});
