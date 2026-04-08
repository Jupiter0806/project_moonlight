"use server";

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
    // TODO: replace with real API call to POST /api/answer
    await new Promise((res) => setTimeout(res, 800));

    const answer = `(Dummy answer to: "${question}")`;

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
