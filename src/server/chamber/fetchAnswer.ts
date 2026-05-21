import { GoogleGenerativeAI } from "@google/generative-ai";

const QA_MODEL = "gemini-3.1-flash-lite";
const QA_TIMEOUT_MS = 60_000;

export async function fetchAnswer(question: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel(
    { model: QA_MODEL },
    { timeout: QA_TIMEOUT_MS },
  );

  try {
    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [{ text: question }],
        },
      ],
      generationConfig: {
        temperature: 0.3,
      },
    });

    const answer = result.response.text();

    if (!answer.trim()) {
      throw new Error("Gemini returned an empty answer");
    }

    return answer;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout/i.test(message)) {
      throw new Error("Gemini request timed out");
    }
    throw error;
  }
}
