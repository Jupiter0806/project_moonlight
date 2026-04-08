import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/useDebounce";
import { useIsMobile } from "@/hooks/useIsMobile";
import { TranslateThis } from "./TranslateThis";

vi.mock("@tanstack/react-query", () => ({ useQuery: vi.fn() }));
vi.mock("@/hooks/useDebounce", () => ({
  useDebounce: vi.fn((v: unknown) => v),
}));
vi.mock("@/hooks/useIsMobile", () => ({ useIsMobile: vi.fn(() => false) }));

const mockUseQuery = vi.mocked(useQuery);
const mockUseDebounce = vi.mocked(useDebounce);
const mockUseIsMobile = vi.mocked(useIsMobile);

// --- Tests are written against stated requirements, not implementation details ---
// Requirements:
//   1. Takes sourceText and languages (source, target) from props and passes them to the query
//   2. Debounces the API call — 400ms on desktop, 1000ms on mobile — and renders the result
//   3. useQuery cache lasts forever (staleTime: Infinity)
//   4. When error occurs, empties the result (calls onResult with "")

const defaultProps = {
  sourceText: "Hello",
  source: "en" as const,
  target: "zh-CN" as const,
};

const idleQuery = { data: undefined, isLoading: false, error: null };

describe("TranslateThis", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseQuery.mockReturnValue(idleQuery as ReturnType<typeof useQuery>);
    mockUseDebounce.mockImplementation((v) => v as string);
    mockUseIsMobile.mockReturnValue(false);
  });

  // Req 1: takes sourceText and languages from props
  describe("props passed to query", () => {
    it("includes the debounced sourceText in the query key", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.queryKey).toContain("Hello");
    });

    it("includes the source language in the query key", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.queryKey).toContain("en");
    });

    it("includes the target language in the query key", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.queryKey).toContain("zh-CN");
    });

    it("disables the query when sourceText is empty", () => {
      render(<TranslateThis {...defaultProps} sourceText="" />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.enabled).toBe(false);
    });

    it("enables the query when sourceText is non-empty", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.enabled).toBe(true);
    });
  });

  // Req 2: debounce delay and result rendering
  describe("debounce and result", () => {
    it("uses 400ms debounce on desktop", () => {
      mockUseIsMobile.mockReturnValue(false);
      render(<TranslateThis {...defaultProps} />);
      expect(mockUseDebounce).toHaveBeenCalledWith("Hello", 400);
    });

    it("uses 1000ms debounce on mobile", () => {
      mockUseIsMobile.mockReturnValue(true);
      render(<TranslateThis {...defaultProps} />);
      expect(mockUseDebounce).toHaveBeenCalledWith("Hello", 1000);
    });

    it("uses the debounced value in the query key, not the raw sourceText", () => {
      mockUseDebounce.mockReturnValue("debounced value");
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.queryKey).toContain("debounced value");
      expect(config.queryKey).not.toContain("Hello");
    });

    it("renders the translated text when available", () => {
      mockUseQuery.mockReturnValue({
        data: "你好",
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);
      render(<TranslateThis {...defaultProps} />);
      expect(screen.getByText("你好")).toBeInTheDocument();
    });

    it("renders empty when sourceText is empty regardless of cached data", () => {
      mockUseQuery.mockReturnValue({
        data: "你好",
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);
      render(<TranslateThis {...defaultProps} sourceText="" />);
      expect(screen.queryByText("你好")).not.toBeInTheDocument();
    });

    it("shows a loading indicator while the query is in-flight", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
      } as ReturnType<typeof useQuery>);
      render(<TranslateThis {...defaultProps} />);
      expect(screen.getByText("Translating...")).toBeInTheDocument();
    });
  });

  // Req 3: cache lasts forever
  describe("cache configuration", () => {
    it("sets staleTime to Infinity", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.staleTime).toBe(Infinity);
    });

    it("disables automatic retry on failure", () => {
      render(<TranslateThis {...defaultProps} />);
      const [config] = mockUseQuery.mock.calls[0];
      expect(config.retry).toBe(false);
    });
  });

  // Req 4: when error, empty the results
  describe("error handling", () => {
    it("calls onResult with empty string when the query errors", () => {
      const onResult = vi.fn();
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("Translation failed"),
      } as ReturnType<typeof useQuery>);
      render(<TranslateThis {...defaultProps} onResult={onResult} />);
      expect(onResult).toHaveBeenCalledWith("");
    });

    it("calls onResult with the translated text on success", () => {
      const onResult = vi.fn();
      mockUseQuery.mockReturnValue({
        data: "你好",
        isLoading: false,
        error: null,
      } as ReturnType<typeof useQuery>);
      render(<TranslateThis {...defaultProps} onResult={onResult} />);
      expect(onResult).toHaveBeenCalledWith("你好");
    });

    it("does not call onResult when there is no data and no error", () => {
      const onResult = vi.fn();
      render(<TranslateThis {...defaultProps} onResult={onResult} />);
      expect(onResult).not.toHaveBeenCalled();
    });

    it("does not throw when onResult is not provided and an error occurs", () => {
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error("fail"),
      } as ReturnType<typeof useQuery>);
      expect(() => render(<TranslateThis {...defaultProps} />)).not.toThrow();
    });
  });
});
