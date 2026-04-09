import { ChamberTraceList } from "@/features/ChamberTraceList/ChamberTraceList";
import { CamphorInput } from "../CamphorInput/CamphorInput";

export function Chamber() {
  return (
    <div className="flex h-full w-full flex-col">
      {/*
       * SCROLL VIEW — placeholder
       *
       * Requirements:
       * - Takes all space not occupied by CamphorInput (flex-1 + overflow-y-auto)
       * - Renders the list of AI answers/messages in reverse-chronological order
       * - On mobile, content remains fully scrollable even when the keyboard is open
       *   because the scroll area sits above the sticky input in the flex column
       */}
      <div className="flex-1 p-4">
        <ChamberTraceList />
      </div>

      {/*
       * CAMPHOR INPUT — sticks to the bottom of the visible viewport.
       * `sticky bottom-2` keeps it above the keyboard on iOS/Android because
       * the browser shrinks the visual viewport when the keyboard appears,
       * and the dvh-based root container shrinks with it.
       */}
      <div className="sticky bottom-2 px-2">
        <CamphorInput />
      </div>
    </div>
  );
}
