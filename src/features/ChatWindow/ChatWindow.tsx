"use client";

import {
  useActionState,
  useEffect,
  useOptimistic,
  useRef,
  useTransition,
} from "react";
import { sendMessageAction } from "./actions";
import type { Message, ChatActionState } from "./actions";

interface ChatWindowProps {
  initialMessages?: Message[];
}

export function ChatWindow({ initialMessages = [] }: ChatWindowProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const [state, formAction] = useActionState<ChatActionState, FormData>(
    sendMessageAction,
    {
      messages: initialMessages,
      error: null,
      lastAttempt: null,
      attemptCount: 0,
    } satisfies ChatActionState,
  );
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<
    Message[],
    string
  >(state.messages, (current, newMessage) => [
    ...current,
    { id: "temp", text: newMessage, sending: true },
  ]);

  const handleSubmit = async (formData: FormData) => {
    const text = formData.get("message") as string;
    if (!text) return;

    addOptimisticMessage(text);
    formRef.current?.reset();
    await formAction(formData);
  };

  function handleRetry() {
    if (!state.lastAttempt) return;
    const retryData = new FormData();
    retryData.append("message", state.lastAttempt);
    startTransition(() => {
      formAction(retryData);
    });
  }

  // todo
  // a service is need to handle all shortcut and generate a keybinding reference for users. For now, we just add a simple retry shortcut (R) for demo purpose.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "r" && state.lastAttempt && !isPending) {
        e.preventDefault(); // prevent browser reload
        handleRetry();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [state.lastAttempt, isPending]);

  return (
    <div className="bg-surface-elevated max-w-md rounded-lg border p-4 shadow">
      <div className="mb-4 h-64 space-y-2 overflow-y-auto">
        {optimisticMessages.map((m) => (
          <div
            key={m.id}
            className={`w-fit rounded-lg p-2 ${m.sending ? "bg-gray-100 text-gray-400 italic" : "ml-auto bg-blue-600 text-white"}`}
          >
            {m.text} {m.sending && "..."}
          </div>
        ))}

        {state.error && (
          <div className="flex items-center justify-between rounded border border-red-200 bg-red-50 p-2 text-sm text-red-600">
            <span>Failed: {state.error}</span>
            {state.lastAttempt && (
              <button
                onClick={handleRetry}
                className="font-bold underline"
                disabled={isPending}
              >
                Retry{state.attemptCount > 0 ? ` (${state.attemptCount})` : ""}{" "}
                {isPending && "..."}
              </button>
            )}
          </div>
        )}
      </div>

      <form ref={formRef} action={handleSubmit} className="flex gap-2">
        <input
          name="message"
          className="flex-1 rounded border px-2"
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="rounded bg-blue-600 px-4 py-1 text-white"
        >
          Send
        </button>
      </form>
    </div>
  );
}
