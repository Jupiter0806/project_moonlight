import { describe, it, expect, vi, beforeEach } from "vitest";
import { translateText } from "./translateService";

// --- Tests are written against the stated requirements, not the implementation ---
// Requirements:
//   - Translate provided text using Google Translate API
//   - Accept source and target language (keys from LANGUAGES config)
//   - Return the translated string

const mockTranslatedText = "你好世界";

function mockOkFetch(translatedText: string) {
  return vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({
      data: { translations: [{ translatedText }] },
    }),
  });
}

describe("translateService", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe("translateText", () => {
    it("returns the translated text for valid input", async () => {
      vi.stubGlobal("fetch", mockOkFetch(mockTranslatedText));
      const result = await translateText("Hello world", "en", "zh-CN");
      expect(result).toBe(mockTranslatedText);
    });

    it("sends the source text in the request body", async () => {
      const fetchMock = mockOkFetch(mockTranslatedText);
      vi.stubGlobal("fetch", fetchMock);

      await translateText("Hello world", "en", "zh-CN");

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.q).toBe("Hello world");
    });

    it("sends the correct source language in the request body", async () => {
      const fetchMock = mockOkFetch(mockTranslatedText);
      vi.stubGlobal("fetch", fetchMock);

      await translateText("Hello", "en", "zh-CN");

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.source).toBe("en");
    });

    it("sends the correct target language in the request body", async () => {
      const fetchMock = mockOkFetch(mockTranslatedText);
      vi.stubGlobal("fetch", fetchMock);

      await translateText("Hello", "en", "zh-CN");

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.target).toBe("zh-CN");
    });

    it("sends the request as plain text format", async () => {
      const fetchMock = mockOkFetch(mockTranslatedText);
      vi.stubGlobal("fetch", fetchMock);

      await translateText("Hello", "en", "zh-CN");

      const body = JSON.parse(fetchMock.mock.calls[0][1].body);
      expect(body.format).toBe("text");
    });

    it("throws when the API returns a non-OK response", async () => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({ ok: false, status: 400 }),
      );

      await expect(translateText("Hello", "en", "zh-CN")).rejects.toThrow(
        "Translation API error",
      );
    });

    // Edge cases

    it("translates an empty string without throwing", async () => {
      vi.stubGlobal("fetch", mockOkFetch(""));
      const result = await translateText("", "en", "zh-CN");
      expect(result).toBe("");
    });

    it("translates in the reverse direction (zh-CN → en)", async () => {
      vi.stubGlobal("fetch", mockOkFetch("Hello world"));
      const result = await translateText("你好世界", "zh-CN", "en");
      expect(result).toBe("Hello world");
    });
  });
});
