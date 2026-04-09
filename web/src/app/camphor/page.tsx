"use client";

import { CamphorInput } from "@/widgets/CamphorInput/CamphorInput";

export default function CamphorPage() {
  return (
    /*
     * Root container: full viewport height, column flex.
     * On mobile, `dvh` units ensure the layout responds to the browser chrome
     * (address bar appearing/disappearing) correctly.
     */
    <div className="flex h-dvh max-w-xl flex-col">
      {/*
       * SCROLL VIEW — placeholder
       *
       * Requirements:
       * - Takes all space not occupied by CamphorInput (flex-1 + overflow-y-auto)
       * - Renders the list of AI answers/messages in reverse-chronological order
       * - On mobile, content remains fully scrollable even when the keyboard is open
       *   because the scroll area sits above the sticky input in the flex column
       * - TODO: map over answers from state/atoms and render each answer card
       * - TODO: auto-scroll to the latest answer when new content arrives
       * - TODO: preserve scroll position when the keyboard opens/closes
       */}
      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm opacity-50">Answers will appear here</p>
      </div>

      {/*
       * CAMPHOR INPUT — sticks to the bottom of the visible viewport.
       * `sticky bottom-0` keeps it above the keyboard on iOS/Android because
       * the browser shrinks the visual viewport when the keyboard appears,
       * and the dvh-based root container shrinks with it.
       */}
      <div className="sticky bottom-0">
        <CamphorInput />
      </div>
    </div>
  );
}
