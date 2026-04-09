import { describe, it, expect } from "vitest";
import urtReducer, {
  appendEntries,
  prependEntries,
  setFetchStatus,
  updateNewReflectionsBar,
  resetTimeline,
  selectURTEntries,
  selectURTFetchStatus,
  selectNewReflectionsBar,
} from "./urtSlice";
import {
  fetchTimeline,
  type URTEntry,
  type FetchTimelineResult,
} from "@/store/thunks/fetchTimeline";
import type { RootState } from "@/store/store";

const makeEntry = (id: string): URTEntry => ({
  type: "trace",
  entryId: id,
  content: { id, displayType: "trace" },
});

const makeResult = (
  overrides: Partial<FetchTimelineResult> = {},
): FetchTimelineResult => ({
  timeline: "camphorTraces",
  direction: "new",
  response: { entries: [], traces: [], reflections: [], users: [] },
  ...overrides,
});

const toRoot = (urtState: ReturnType<typeof urtReducer>): RootState =>
  ({ urt: urtState }) as RootState;

describe("urtSlice", () => {
  describe("initial state", () => {
    it("initializes all 4 timelines with empty entries", () => {
      const state = urtReducer(undefined, { type: "@@INIT" });
      expect(state.camphorTraces.entries).toEqual([]);
      expect(state.camphorReflections.entries).toEqual([]);
      expect(state.moonlightTraces.entries).toEqual([]);
      expect(state.moonlightReflections.entries).toEqual([]);
    });

    it("initializes timestamps to 0", () => {
      const state = urtReducer(undefined, { type: "@@INIT" });
      expect(state.camphorTraces.lastFetchTimestamp).toBe(0);
      expect(state.camphorTraces.lastTopFetchTimestamp).toBe(0);
    });

    it("initializes fetchStatus as an empty map", () => {
      const state = urtReducer(undefined, { type: "@@INIT" });
      expect(state.camphorTraces.fetchStatus).toEqual({});
    });

    it("initializes newReflectionsBar with count 0", () => {
      const state = urtReducer(undefined, { type: "@@INIT" });
      expect(state.camphorTraces.newReflectionsBar.count).toBe(0);
    });
  });

  describe("appendEntries", () => {
    it("appends entries to the end of the specified timeline", () => {
      const e1 = makeEntry("e1");
      const e2 = makeEntry("e2");
      let state = urtReducer(
        undefined,
        appendEntries({ timeline: "camphorTraces", entries: [e1] }),
      );
      state = urtReducer(
        state,
        appendEntries({ timeline: "camphorTraces", entries: [e2] }),
      );
      expect(state.camphorTraces.entries).toEqual([e1, e2]);
    });

    it("does not affect other timelines", () => {
      const state = urtReducer(
        undefined,
        appendEntries({
          timeline: "camphorTraces",
          entries: [makeEntry("e1")],
        }),
      );
      expect(state.camphorReflections.entries).toEqual([]);
    });
  });

  describe("prependEntries", () => {
    it("inserts entries at the start of the timeline", () => {
      const existing = makeEntry("existing");
      const newTop = makeEntry("new-top");
      let state = urtReducer(
        undefined,
        appendEntries({ timeline: "camphorTraces", entries: [existing] }),
      );
      state = urtReducer(
        state,
        prependEntries({ timeline: "camphorTraces", entries: [newTop] }),
      );
      expect(state.camphorTraces.entries[0]).toEqual(newTop);
      expect(state.camphorTraces.entries[1]).toEqual(existing);
    });

    it("does not affect other timelines", () => {
      const state = urtReducer(
        undefined,
        prependEntries({
          timeline: "camphorTraces",
          entries: [makeEntry("e1")],
        }),
      );
      expect(state.camphorReflections.entries).toEqual([]);
    });
  });

  describe("setFetchStatus", () => {
    it("sets fetchStatus for a specific cursor key", () => {
      const state = urtReducer(
        undefined,
        setFetchStatus({
          timeline: "camphorTraces",
          cursor: "cursor-abc",
          status: "loading",
        }),
      );
      expect(state.camphorTraces.fetchStatus["cursor-abc"]).toBe("loading");
    });

    it("does not overwrite other cursors", () => {
      let state = urtReducer(
        undefined,
        setFetchStatus({
          timeline: "camphorTraces",
          cursor: "cursor-1",
          status: "loaded",
        }),
      );
      state = urtReducer(
        state,
        setFetchStatus({
          timeline: "camphorTraces",
          cursor: "cursor-2",
          status: "loading",
        }),
      );
      expect(state.camphorTraces.fetchStatus["cursor-1"]).toBe("loaded");
    });

    it("does not affect other timelines", () => {
      const state = urtReducer(
        undefined,
        setFetchStatus({
          timeline: "camphorTraces",
          cursor: "initial",
          status: "loading",
        }),
      );
      expect(state.camphorReflections.fetchStatus).toEqual({});
    });
  });

  describe("updateNewReflectionsBar", () => {
    it("updates count and instructions for the specified timeline", () => {
      const bar = { count: 7, instructions: [{ type: "scroll", params: {} }] };
      const state = urtReducer(
        undefined,
        updateNewReflectionsBar({ timeline: "camphorReflections", bar }),
      );
      expect(state.camphorReflections.newReflectionsBar).toEqual(bar);
    });

    it("does not affect other timelines", () => {
      const state = urtReducer(
        undefined,
        updateNewReflectionsBar({
          timeline: "camphorReflections",
          bar: { count: 7, instructions: [] },
        }),
      );
      expect(state.camphorTraces.newReflectionsBar.count).toBe(0);
    });
  });

  describe("resetTimeline", () => {
    it("resets entries, fetchStatus, and timestamps to empty state", () => {
      let state = urtReducer(
        undefined,
        appendEntries({
          timeline: "camphorTraces",
          entries: [makeEntry("e1")],
        }),
      );
      state = urtReducer(
        state,
        setFetchStatus({
          timeline: "camphorTraces",
          cursor: "initial",
          status: "loaded",
        }),
      );
      state = urtReducer(state, resetTimeline("camphorTraces"));
      expect(state.camphorTraces.entries).toEqual([]);
      expect(state.camphorTraces.fetchStatus).toEqual({});
      expect(state.camphorTraces.lastFetchTimestamp).toBe(0);
    });

    it("does not affect other timelines", () => {
      let state = urtReducer(
        undefined,
        appendEntries({
          timeline: "camphorReflections",
          entries: [makeEntry("e1")],
        }),
      );
      state = urtReducer(state, resetTimeline("camphorTraces"));
      expect(state.camphorReflections.entries).toHaveLength(1);
    });
  });

  describe("fetchTimeline extraReducers", () => {
    const baseArg = {
      timeline: "camphorTraces" as const,
      direction: "new" as const,
    };

    describe("pending", () => {
      it("sets fetchStatus to 'loading' for 'initial' when no cursor provided", () => {
        const state = urtReducer(
          undefined,
          fetchTimeline.pending("r1", baseArg),
        );
        expect(state.camphorTraces.fetchStatus["initial"]).toBe("loading");
      });

      it("sets fetchStatus to 'loading' for the specified cursor", () => {
        const state = urtReducer(
          undefined,
          fetchTimeline.pending("r1", { ...baseArg, cursor: "cursor-xyz" }),
        );
        expect(state.camphorTraces.fetchStatus["cursor-xyz"]).toBe("loading");
      });

      it("does not affect other timelines", () => {
        const state = urtReducer(
          undefined,
          fetchTimeline.pending("r1", baseArg),
        );
        expect(state.camphorReflections.fetchStatus).toEqual({});
      });
    });

    describe("fulfilled – direction: 'new'", () => {
      it("appends entries to the timeline", () => {
        const payload = makeResult({
          response: {
            entries: [makeEntry("e1"), makeEntry("e2")],
            traces: [],
            reflections: [],
            users: [],
          },
        });
        const state = urtReducer(
          undefined,
          fetchTimeline.fulfilled(payload, "r1", baseArg),
        );
        expect(state.camphorTraces.entries).toEqual([
          makeEntry("e1"),
          makeEntry("e2"),
        ]);
      });

      it("marks fetchStatus as 'loaded' for the cursor", () => {
        const payload = makeResult({
          response: { entries: [], traces: [], reflections: [], users: [] },
        });
        const state = urtReducer(
          undefined,
          fetchTimeline.fulfilled(payload, "r1", baseArg),
        );
        expect(state.camphorTraces.fetchStatus["initial"]).toBe("loaded");
      });

      it("updates lastFetchTimestamp but not lastTopFetchTimestamp", () => {
        const payload = makeResult({
          response: { entries: [], traces: [], reflections: [], users: [] },
        });
        const state = urtReducer(
          undefined,
          fetchTimeline.fulfilled(payload, "r1", baseArg),
        );
        expect(state.camphorTraces.lastFetchTimestamp).toBeGreaterThan(0);
        expect(state.camphorTraces.lastTopFetchTimestamp).toBe(0);
      });
    });

    describe("fulfilled – direction: 'top'", () => {
      const topArg = { ...baseArg, direction: "top" as const };

      it("prepends entries to the timeline", () => {
        const existing = makeEntry("existing");
        let state = urtReducer(
          undefined,
          appendEntries({ timeline: "camphorTraces", entries: [existing] }),
        );
        const payload = makeResult({
          direction: "top",
          response: {
            entries: [makeEntry("new-top")],
            traces: [],
            reflections: [],
            users: [],
          },
        });
        state = urtReducer(
          state,
          fetchTimeline.fulfilled(payload, "r1", topArg),
        );
        expect(state.camphorTraces.entries[0]).toEqual(makeEntry("new-top"));
        expect(state.camphorTraces.entries[1]).toEqual(existing);
      });

      it("updates lastTopFetchTimestamp but not lastFetchTimestamp", () => {
        const payload = makeResult({
          direction: "top",
          response: { entries: [], traces: [], reflections: [], users: [] },
        });
        const state = urtReducer(
          undefined,
          fetchTimeline.fulfilled(payload, "r1", topArg),
        );
        expect(state.camphorTraces.lastTopFetchTimestamp).toBeGreaterThan(0);
        expect(state.camphorTraces.lastFetchTimestamp).toBe(0);
      });
    });

    describe("fulfilled – newReflectionsBar", () => {
      it("updates bar when present in the response", () => {
        const bar = { count: 3, instructions: [] };
        const payload = makeResult({
          response: {
            entries: [],
            traces: [],
            reflections: [],
            users: [],
            newReflectionsBar: bar,
          },
        });
        const state = urtReducer(
          undefined,
          fetchTimeline.fulfilled(payload, "r1", baseArg),
        );
        expect(state.camphorTraces.newReflectionsBar).toEqual(bar);
      });

      it("does not reset bar when absent from the response", () => {
        let state = urtReducer(
          undefined,
          updateNewReflectionsBar({
            timeline: "camphorTraces",
            bar: { count: 5, instructions: [] },
          }),
        );
        const payload = makeResult({
          response: { entries: [], traces: [], reflections: [], users: [] },
        });
        state = urtReducer(
          state,
          fetchTimeline.fulfilled(payload, "r1", baseArg),
        );
        expect(state.camphorTraces.newReflectionsBar.count).toBe(5);
      });
    });

    describe("rejected", () => {
      it("sets fetchStatus back to 'none'", () => {
        let state = urtReducer(undefined, fetchTimeline.pending("r1", baseArg));
        expect(state.camphorTraces.fetchStatus["initial"]).toBe("loading");
        state = urtReducer(state, fetchTimeline.rejected(null, "r1", baseArg));
        expect(state.camphorTraces.fetchStatus["initial"]).toBe("none");
      });

      it("does not modify entries", () => {
        const state = urtReducer(
          undefined,
          fetchTimeline.rejected(null, "r1", baseArg),
        );
        expect(state.camphorTraces.entries).toEqual([]);
      });
    });
  });

  describe("selectors", () => {
    it("selectURTEntries returns entries for the specified timeline", () => {
      const e1 = makeEntry("e1");
      const rootState = toRoot(
        urtReducer(
          undefined,
          appendEntries({ timeline: "camphorTraces", entries: [e1] }),
        ),
      );
      expect(selectURTEntries("camphorTraces")(rootState)).toEqual([e1]);
    });

    it("selectURTFetchStatus returns 'none' when no status is set", () => {
      expect(
        selectURTFetchStatus("camphorTraces")(
          toRoot(urtReducer(undefined, { type: "@@INIT" })),
        ),
      ).toBe("none");
    });

    it("selectURTFetchStatus returns the correct status for a cursor", () => {
      const rootState = toRoot(
        urtReducer(
          undefined,
          fetchTimeline.pending("r1", {
            timeline: "camphorTraces",
            direction: "new",
          }),
        ),
      );
      expect(selectURTFetchStatus("camphorTraces", "initial")(rootState)).toBe(
        "loading",
      );
    });

    it("selectNewReflectionsBar returns the bar for the specified timeline", () => {
      const bar = { count: 2, instructions: [] };
      const rootState = toRoot(
        urtReducer(
          undefined,
          updateNewReflectionsBar({ timeline: "camphorTraces", bar }),
        ),
      );
      expect(selectNewReflectionsBar("camphorTraces")(rootState)).toEqual(bar);
    });
  });
});
