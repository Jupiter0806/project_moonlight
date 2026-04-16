import { describe, it, expect } from "vitest";
import pinnedTimelinesReducer, {
  setFetchState,
  setSelectedTimeline,
  setTimelines,
  selectFetchState,
  selectSelectedTimeline,
  selectTimelines,
} from "./pinnedTimelinesSlice";
import type { RootState } from "@/store/store";

const makeRootState = (
  overrides: Partial<RootState["pinnedTimelines"]> = {},
): RootState =>
  ({
    pinnedTimelines: {
      fetchState: "none",
      selectedTimeline: null,
      timelines: [
        { type: "camphor" },
        { type: "camphor-translate", sort: "popular" },
        { type: "camphor-self" },
        { type: "camphor-today" },
      ],
      ...overrides,
    },
  }) as RootState;

describe("pinnedTimelinesSlice", () => {
  describe("initial state", () => {
    it("renders without error using undefined state", () => {
      const state = pinnedTimelinesReducer(undefined, { type: "@@INIT" });
      expect(state.fetchState).toBe("none");
      expect(state.selectedTimeline).toBeNull();
      expect(state.timelines).toHaveLength(4);
    });

    it("pre-populates timelines with the available timelines", () => {
      const state = pinnedTimelinesReducer(undefined, { type: "@@INIT" });
      expect(state.timelines).toEqual([
        { type: "camphor" },
        { type: "camphor-translate", sort: "popular" },
        { type: "camphor-self" },
        { type: "camphor-today" },
      ]);
    });
  });

  describe("setFetchState", () => {
    it('sets fetchState to "loading"', () => {
      const state = pinnedTimelinesReducer(undefined, setFetchState("loading"));
      expect(state.fetchState).toBe("loading");
    });

    it('sets fetchState to "done"', () => {
      const state = pinnedTimelinesReducer(undefined, setFetchState("done"));
      expect(state.fetchState).toBe("done");
    });

    it('resets fetchState back to "none"', () => {
      const prev = pinnedTimelinesReducer(undefined, setFetchState("done"));
      const state = pinnedTimelinesReducer(prev, setFetchState("none"));
      expect(state.fetchState).toBe("none");
    });

    it("does not affect other state fields", () => {
      const prev = pinnedTimelinesReducer(
        undefined,
        setSelectedTimeline("camphor"),
      );
      const state = pinnedTimelinesReducer(prev, setFetchState("loading"));
      expect(state.selectedTimeline).toBe("camphor");
    });
  });

  describe("setSelectedTimeline", () => {
    it("sets a timeline string", () => {
      const state = pinnedTimelinesReducer(
        undefined,
        setSelectedTimeline("camphor"),
      );
      expect(state.selectedTimeline).toBe("camphor");
    });

    it("clears selected timeline when set to null", () => {
      const prev = pinnedTimelinesReducer(
        undefined,
        setSelectedTimeline("camphor"),
      );
      const state = pinnedTimelinesReducer(prev, setSelectedTimeline(null));
      expect(state.selectedTimeline).toBeNull();
    });

    it("replaces a previously selected timeline", () => {
      const prev = pinnedTimelinesReducer(
        undefined,
        setSelectedTimeline("camphor"),
      );
      const state = pinnedTimelinesReducer(
        prev,
        setSelectedTimeline("camphor-self"),
      );
      expect(state.selectedTimeline).toBe("camphor-self");
    });

    it("does not affect fetchState", () => {
      const prev = pinnedTimelinesReducer(undefined, setFetchState("done"));
      const state = pinnedTimelinesReducer(
        prev,
        setSelectedTimeline("camphor"),
      );
      expect(state.fetchState).toBe("done");
    });
  });

  describe("setTimelines", () => {
    it("replaces the timelines list", () => {
      const newTimelines = [{ type: "custom" }];
      const state = pinnedTimelinesReducer(
        undefined,
        setTimelines(newTimelines),
      );
      expect(state.timelines).toEqual(newTimelines);
    });

    it("accepts an empty array", () => {
      const state = pinnedTimelinesReducer(undefined, setTimelines([]));
      expect(state.timelines).toEqual([]);
    });

    it("does not affect selectedTimeline", () => {
      const prev = pinnedTimelinesReducer(
        undefined,
        setSelectedTimeline("camphor"),
      );
      const state = pinnedTimelinesReducer(prev, setTimelines([]));
      expect(state.selectedTimeline).toBe("camphor");
    });
  });

  describe("selectors", () => {
    describe("selectFetchState", () => {
      it("returns fetchState from root state", () => {
        expect(selectFetchState(makeRootState({ fetchState: "loading" }))).toBe(
          "loading",
        );
      });
    });

    describe("selectSelectedTimeline", () => {
      it("returns selectedTimeline from root state", () => {
        expect(
          selectSelectedTimeline(
            makeRootState({ selectedTimeline: "camphor-self" }),
          ),
        ).toBe("camphor-self");
      });

      it("returns null when no timeline is selected", () => {
        expect(
          selectSelectedTimeline(makeRootState({ selectedTimeline: null })),
        ).toBeNull();
      });
    });

    describe("selectTimelines", () => {
      it("returns timelines array from root state", () => {
        const timelines = [{ type: "camphor" }];
        expect(selectTimelines(makeRootState({ timelines }))).toEqual(
          timelines,
        );
      });
    });
  });
});
