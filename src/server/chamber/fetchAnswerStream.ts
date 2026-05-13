import { GoogleGenerativeAI } from "@google/generative-ai";

const QA_MODEL = "gemini-3.1-flash-lite";
const QA_TIMEOUT_MS = 180_000;

export interface QaSessionMessage {
  role: "user" | "model";
  parts: { text: string }[];
}

export async function* fetchAnswerStream(
  question: string,
  history: QaSessionMessage[] = [],
): AsyncGenerator<string, void, void> {
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
    const chat = model.startChat({ history });
    const result = await chat.sendMessageStream(question);

    let hasChunks = false;

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (!text) {
        continue;
      }
      hasChunks = true;
      yield text;
    }

    if (!hasChunks) {
      throw new Error("Gemini returned an empty streamed answer");
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/timeout/i.test(message)) {
      throw new Error("Gemini streaming request timed out");
    }
    throw error;
  }
}

export async function fetchAnswerViaStream(question: string): Promise<string> {
  let fullAnswer = "";

  for await (const chunkText of fetchAnswerStream(question, [])) {
    fullAnswer += chunkText;
  }

  return fullAnswer;
}
