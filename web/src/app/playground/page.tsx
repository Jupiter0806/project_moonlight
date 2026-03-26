import { ChatWindow } from "@/widgets/playground/ChatWindow/ChatWindow";

export default function PlaygroundPage() {
  return (
    <div className="bg-surface flex flex-1 flex-col items-center">
      <main className="bg-surface-elevated my-8 flex w-full max-w-3xl flex-1 flex-col items-center gap-2 px-16 py-32 sm:items-start">
        <h1 className="text-foreground text-4xl font-bold tracking-tight">
          Playground
        </h1>

        <div className="flex w-full flex-col items-center gap-8">
          <ChatWindow />
        </div>
      </main>
    </div>
  );
}
