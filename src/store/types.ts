import type { Trace } from "@/types/Trace";
import type { Reflection } from "@/types/Reflection";
import type { User } from "@/types/User";
import type { URTInstruction } from "@/types/URTInstruction";
import { FetchState } from "@/types/FetchState";

// Exported here to avoid circular imports between urtSlice ↔ entitiesSlice ↔ store.
export type URTTimeline =
  | "camphorReflections"
  | "camphorTraces"
  | "chamberTraces"
  | "moonlightReflections"
  | "moonlightTraces";

export interface URTEntryBase {
  entryId: string;
  content: unknown;
}

export interface URTEntryCursor extends URTEntryBase {
  type: "timeline-cursor";
  content: {
    cursorType: "top" | "bottom";
    value: string;
  };
}

export interface URTEntryUI extends URTEntryBase {
  type: "trace" | "reflection";
  entryId: string;
  content: {
    id: string;
    displayType: "reflection" | "qa-trace" | "translation-trace" | "none";
  };
}

export type URTEntry = URTEntryCursor | URTEntryUI;

export interface TimelineApiResponse {
  entries: URTEntry[];
  traces: Trace[];
  reflections: Reflection[];
  users: User[];
  topCursor?: string;
  bottomCursor?: string;
  nextCursor?: string;
  hasMoreTop?: boolean;
  hasMoreBottom?: boolean;
  newReflectionsBar?: {
    count: number;
    instructions: URTInstruction[];
  };
  fetchStatus?: Record<string, FetchState>;
}

export interface FetchTimelineArg {
  timeline: URTTimeline;
  /** Pagination cursor; omit for the initial page ("initial" is used as the key). */
  cursor?: string;
  direction: "top" | "bottom" | "new";
}

export interface FetchTimelineResult {
  timeline: URTTimeline;
  direction: "top" | "bottom" | "new";
  cursor?: string;
  response: TimelineApiResponse;
}
