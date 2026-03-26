jest.mock("../../src/config/gemini.js", () => ({
  geminiModel: {
    generateContent: jest.fn(),
  },
}));

import { geminiModel } from "../../src/config/gemini.js";
import { getAnswer } from "../../src/services/aiService.js";

const mockGemini = geminiModel as jest.Mocked<typeof geminiModel>;

describe("aiService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getAnswer", () => {
    it("returns the text from Gemini response", async () => {
      (mockGemini.generateContent as jest.Mock).mockResolvedValue({
        response: {
          text: () =>
            "Photosynthesis is the process by which plants make food.",
        },
      });

      const answer = await getAnswer("What is photosynthesis?");

      expect(answer).toBe(
        "Photosynthesis is the process by which plants make food.",
      );
      expect(mockGemini.generateContent).toHaveBeenCalledTimes(1);
    });

    it("throws when Gemini returns an empty response", async () => {
      (mockGemini.generateContent as jest.Mock).mockResolvedValue({
        response: { text: () => "" },
      });

      await expect(getAnswer("silence?")).rejects.toThrow(
        "Gemini returned an empty response",
      );
    });

    it("propagates errors from the Gemini client", async () => {
      (mockGemini.generateContent as jest.Mock).mockRejectedValue(
        new Error("API quota exceeded"),
      );

      await expect(getAnswer("any question")).rejects.toThrow(
        "API quota exceeded",
      );
    });
  });
});
