import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY env var is required");
}

export const genAI = new GoogleGenerativeAI(apiKey);

/** Gemini Flash — optimised for low latency Q&A. */
export const geminiModel = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
});
