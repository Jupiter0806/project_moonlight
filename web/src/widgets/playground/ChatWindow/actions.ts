"use server";

export interface Message {
  id: string | number;
  text: string;
  sending?: boolean;
}

export interface ChatActionState {
  messages: Message[];
  error: string | null;
  lastAttempt: string | null;
  attemptCount: number;
}

export async function sendMessageAction(
  state: ChatActionState,
  formData: FormData,
): Promise<ChatActionState> {
  const message = formData.get("message") as string;
  try {
    // TODO: replace with real API call to POST /api/answer
    if (Math.random() > 0.5) throw new Error("Database Timeout");

    await new Promise((res) => setTimeout(res, 1000));
    return {
      messages: [...state.messages, { id: Date.now(), text: message }],
      error: null,
      lastAttempt: null,
      attemptCount: 0,
    };
  } catch (err) {
    return {
      ...state,
      error: (err as Error).message,
      lastAttempt: message,
      attemptCount: state.attemptCount + 1,
    };
  }
}
