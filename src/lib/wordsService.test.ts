import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchWordData } from "./wordsService";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   - Fetch definitions and examples for a word via the proxy API
//   - Return typed WordResult with word, definitions, and examples

const mockWordResult = {
  word: "incredible",
  results: [
    {
      definition: "beyond belief or understanding",
      partOfSpeech: "adjective",
      examples: ["the scenery was incredible"],
    },
  ],
};

describe("wordsService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchWordData", () => {
    it("returns definitions and examples for a valid word", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => mockWordResult,
        }),
      );

      const result = await fetchWordData("incredible");

      expect(result.word).toBe("incredible");
      expect(result.results).toEqual(mockWordResult.results);
    });

    it("calls the proxy endpoint with the correct word path", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockWordResult,
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchWordData("incredible");

      expect(fetchMock).toHaveBeenCalledWith("/api/words/incredible");
    });

    it("URL-encodes special characters in the word", async () => {
      const fetchMock = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => ({ word: "test word", results: [] }),
      });
      vi.stubGlobal("fetch", fetchMock);

      await fetchWordData("test word");

      expect(fetchMock).toHaveBeenCalledWith("/api/words/test%20word");
    });

    it("throws a word-not-found error on 404", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 404 }),
      );

      await expect(fetchWordData("xyzzy")).rejects.toThrow(
        "Word not found: xyzzy",
      );
    });

    it("throws a generic error on non-404 failure", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 502 }),
      );

      await expect(fetchWordData("hello")).rejects.toThrow(
        "Failed to fetch word data (502)",
      );
    });

    it("returns empty definitions and examples for a word with no data", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({ word: "xz", results: [] }),
        }),
      );

      const result = await fetchWordData("xz");

      expect(result.results).toEqual([]);
    });
  });
});
