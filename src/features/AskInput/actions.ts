"use server";

import { fetchAnswer } from "@/lib/qa-service";

export interface AskMessage {
  id: string | number;
  role: "user" | "assistant";
  text: string;
}

export interface AskActionState {
  messages: AskMessage[];
  error: string | null;
  lastAttempt: string | null;
}

export async function askAction(
  state: AskActionState,
  formData: FormData,
): Promise<AskActionState> {
  const question = formData.get("question") as string;
  if (!question?.trim()) return state;

  try {
    // const answer = await fetchAnswer(question);
    const answer = "This is a placeholder answer.";

    return {
      messages: [
        ...state.messages,
        { id: Date.now(), role: "user", text: question },
        { id: Date.now() + 1, role: "assistant", text: answer },
      ],
      error: null,
      lastAttempt: null,
    };
  } catch (err) {
    return {
      ...state,
      error: (err as Error).message,
      lastAttempt: question,
    };
  }
}
