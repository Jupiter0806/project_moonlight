import { geminiModel } from "../config/gemini.js";

const SYSTEM_PROMPT = `You are a knowledgeable learning assistant for Project Moonlight.
Help users understand topics clearly and concisely.
When answering, focus on accuracy and clarity. Keep responses helpful but not excessively long.`;

/**
 * Sends a question to Gemini and returns the text answer.
 * Throws if the model returns an empty response.
 */
export async function getAnswer(question: string): Promise<string> {
  const result = await geminiModel.generateContent({
    contents: [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      {
        role: "model",
        parts: [{ text: "Understood. I will help as a learning assistant." }],
      },
      { role: "user", parts: [{ text: question }] },
    ],
  });

  const text = result.response.text();
  if (!text) {
    throw new Error("Gemini returned an empty response");
  }
  return text;
}
