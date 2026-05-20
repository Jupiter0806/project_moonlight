import { describe, it, expect } from "vitest";
import entitiesReducer, {
  upsertTraces,
  upsertReflections,
  removeReflection,
  upsertUsers,
  setTraceError,
  setReflectionError,
  setTraceFetchStatus,
  setReflectionFetchStatus,
  selectAllTraces,
  selectTraceById,
  selectAllReflections,
  selectReflectionById,
  selectAllUsers,
  selectTraceFetchStatus,
  selectTraceError,
  selectReflectionFetchStatus,
} from "./entitiesSlice";
import { fetchTimelineThunk } from "@/store/thunks/fetchTimelineThunk";
import type { TimelineApiResponse, FetchTimelineResult } from "@/store/types";
import type { RootState } from "@/store/store";
import type { Trace, QATrace } from "@/types/Trace";
import type { Reflection } from "@/types/Reflection";
import type { User } from "@/types/User";

const makeQATrace = (
  id: string,
  overrides: Partial<QATrace> = {},
): QATrace => ({
  id,
  createdAt: 0,
  q: "question",
  a: "answer",
  user: "user-1",
  reflection: "reflection-1",
  liked: null,
  type: "qa",
  ...overrides,
});

const makeTrace = (id: string, overrides: Partial<QATrace> = {}): Trace =>
  makeQATrace(id, overrides);

const makeReflection = (
  id: string,
  overrides: Partial<Reflection> = {},
): Reflection => ({
  id,
  createdAt: 0,
  summary: "desc",
  uid: "user-1",
  traceIds: [],
  ...overrides,
});

const makeUser = (id: string): User => ({
  id,
  displayName: "Test User",
  email: "test@example.com",
});

const makeResult = (
  responseOverrides: Partial<TimelineApiResponse> = {},
): FetchTimelineResult => ({
  timeline: "camphorTraces",
  direction: "new",
  response: {
    entries: [],
    traces: [],
    reflections: [],
    users: [],
    ...responseOverrides,
  },
});

const baseArg = {
  timeline: "camphorTraces" as const,
  direction: "new" as const,
};

const toRoot = (state: ReturnType<typeof entitiesReducer>): RootState =>
  ({ entities: state }) as RootState;

describe("entitiesSlice", () => {
  describe("initial state", () => {
    it("initializes with empty traces, reflections, and users", () => {
      const state = entitiesReducer(undefined, { type: "@@INIT" });
      expect(state.traces.ids).toEqual([]);
      expect(state.reflections.ids).toEqual([]);
      expect(state.users.ids).toEqual([]);
    });

    it("initializes errors and fetchStatus as empty maps for each bucket", () => {
      const state = entitiesReducer(undefined, { type: "@@INIT" });
      expect(state.traces.errors).toEqual({});
      expect(state.traces.fetchStatus).toEqual({});
      expect(state.reflections.errors).toEqual({});
      expect(state.reflections.fetchStatus).toEqual({});
    });
  });

  describe("upsertTraces", () => {
    it("stores traces keyed by id", () => {
      const t1 = makeTrace("t1");
      const state = entitiesReducer(undefined, upsertTraces([t1]));
      expect(state.traces.entities["t1"]).toEqual(t1);
    });

    it("upserts without duplication", () => {
      const t1 = makeTrace("t1");
      let state = entitiesReducer(undefined, upsertTraces([t1]));
      state = entitiesReducer(
        state,
        upsertTraces([{ ...t1, q: "updated question" }]),
      );
      expect(state.traces.ids).toHaveLength(1);
      expect(state.traces.entities["t1"]?.q).toBe("updated question");
    });

    it("stores multiple traces", () => {
      const state = entitiesReducer(
        undefined,
        upsertTraces([makeTrace("t1"), makeTrace("t2")]),
      );
      expect(state.traces.ids).toHaveLength(2);
    });

    it("does not affect reflections or users", () => {
      const state = entitiesReducer(undefined, upsertTraces([makeTrace("t1")]));
      expect(state.reflections.ids).toEqual([]);
      expect(state.users.ids).toEqual([]);
    });
  });

  describe("upsertReflections", () => {
    it("stores reflections keyed by id", () => {
      const r1 = makeReflection("r1");
      const state = entitiesReducer(undefined, upsertReflections([r1]));
      expect(state.reflections.entities["r1"]).toEqual(r1);
    });

    it("upserts without duplication", () => {
      const r1 = makeReflection("r1");
      let state = entitiesReducer(undefined, upsertReflections([r1]));
      state = entitiesReducer(
        state,
        upsertReflections([{ ...r1, summary: "updated" }]),
      );
      expect(state.reflections.ids).toHaveLength(1);
      expect(state.reflections.entities["r1"]?.summary).toBe("updated");
    });
  });

  describe("removeReflection", () => {
    it("removes reflection entity by id", () => {
      const r1 = makeReflection("r1");
      let state = entitiesReducer(undefined, upsertReflections([r1]));

      state = entitiesReducer(state, removeReflection({ id: "r1" }));

      expect(state.reflections.entities["r1"]).toBeUndefined();
      expect(state.reflections.ids).toEqual([]);
    });

    it("clears reflection fetch metadata for the removed id", () => {
      let state = entitiesReducer(
        undefined,
        setReflectionError({ id: "r1", error: "failed" }),
      );
      state = entitiesReducer(
        state,
        setReflectionFetchStatus({ id: "r1", status: "loading" }),
      );

      state = entitiesReducer(state, removeReflection({ id: "r1" }));

      expect(state.reflections.errors["r1"]).toBeUndefined();
      expect(state.reflections.fetchStatus["r1"]).toBeUndefined();
    });
  });

  describe("upsertUsers", () => {
    it("stores users keyed by id", () => {
      const u1 = makeUser("u1");
      const state = entitiesReducer(undefined, upsertUsers([u1]));
      expect(state.users.entities["u1"]).toEqual(u1);
    });
  });

  describe("setTraceError", () => {
    it("stores an error message for a trace id", () => {
      const state = entitiesReducer(
        undefined,
        setTraceError({ id: "t1", error: "Not found" }),
      );
      expect(state.traces.errors["t1"]).toBe("Not found");
    });

    it("does not affect other trace errors", () => {
      let state = entitiesReducer(
        undefined,
        setTraceError({ id: "t1", error: "Error 1" }),
      );
      state = entitiesReducer(
        state,
        setTraceError({ id: "t2", error: "Error 2" }),
      );
      expect(state.traces.errors["t1"]).toBe("Error 1");
    });

    it("does not affect reflections error map", () => {
      const state = entitiesReducer(
        undefined,
        setTraceError({ id: "t1", error: "Error" }),
      );
      expect(state.reflections.errors).toEqual({});
    });
  });

  describe("setReflectionError", () => {
    it("stores an error message for a reflection id", () => {
      const state = entitiesReducer(
        undefined,
        setReflectionError({ id: "r1", error: "Fetch failed" }),
      );
      expect(state.reflections.errors["r1"]).toBe("Fetch failed");
    });
  });

  describe("setTraceFetchStatus", () => {
    it("sets fetchStatus for a trace id", () => {
      const state = entitiesReducer(
        undefined,
        setTraceFetchStatus({ id: "t1", status: "loading" }),
      );
      expect(state.traces.fetchStatus["t1"]).toBe("loading");
    });

    it("does not overwrite other trace fetchStatus entries", () => {
      let state = entitiesReducer(
        undefined,
        setTraceFetchStatus({ id: "t1", status: "done" }),
      );
      state = entitiesReducer(
        state,
        setTraceFetchStatus({ id: "t2", status: "loading" }),
      );
      expect(state.traces.fetchStatus["t1"]).toBe("done");
    });

    it("does not affect the reflections fetchStatus", () => {
      const state = entitiesReducer(
        undefined,
        setTraceFetchStatus({ id: "t1", status: "loading" }),
      );
      expect(state.reflections.fetchStatus).toEqual({});
    });
  });

  describe("setReflectionFetchStatus", () => {
    it("sets fetchStatus for a reflection id", () => {
      const state = entitiesReducer(
        undefined,
        setReflectionFetchStatus({ id: "r1", status: "done" }),
      );
      expect(state.reflections.fetchStatus["r1"]).toBe("done");
    });
  });

  describe("fetchTimelineThunk.fulfilled extraReducers (normalization)", () => {
    it("normalizes traces from the API response", () => {
      const t1 = makeTrace("t1");
      const action = fetchTimelineThunk.fulfilled(
        makeResult({ traces: [t1] }),
        "r1",
        baseArg,
      );
      const state = entitiesReducer(undefined, action);
      expect(state.traces.entities["t1"]).toEqual(t1);
    });

    it("normalizes reflections from the API response", () => {
      const r1 = makeReflection("r1");
      const action = fetchTimelineThunk.fulfilled(
        makeResult({ reflections: [r1] }),
        "r1",
        baseArg,
      );
      const state = entitiesReducer(undefined, action);
      expect(state.reflections.entities["r1"]).toEqual(r1);
    });

    it("normalizes users from the API response", () => {
      const u1 = makeUser("u1");
      const action = fetchTimelineThunk.fulfilled(
        makeResult({ users: [u1] }),
        "r1",
        baseArg,
      );
      const state = entitiesReducer(undefined, action);
      expect(state.users.entities["u1"]).toEqual(u1);
    });

    it("upserts without overwriting unrelated existing entities", () => {
      const t1 = makeTrace("t1");
      const t2 = makeTrace("t2");
      let state = entitiesReducer(undefined, upsertTraces([t1]));
      const action = fetchTimelineThunk.fulfilled(
        makeResult({ traces: [t2] }),
        "r1",
        baseArg,
      );
      state = entitiesReducer(state, action);
      expect(state.traces.entities["t1"]).toEqual(t1);
      expect(state.traces.entities["t2"]).toEqual(t2);
    });

    it("handles a response with all empty arrays gracefully", () => {
      const action = fetchTimelineThunk.fulfilled(makeResult(), "r1", baseArg);
      const state = entitiesReducer(undefined, action);
      expect(state.traces.ids).toEqual([]);
      expect(state.reflections.ids).toEqual([]);
      expect(state.users.ids).toEqual([]);
    });

    it("merges multiple entities from the same response", () => {
      const action = fetchTimelineThunk.fulfilled(
        makeResult({
          traces: [makeTrace("t1"), makeTrace("t2"), makeTrace("t3")],
        }),
        "r1",
        baseArg,
      );
      const state = entitiesReducer(undefined, action);
      expect(state.traces.ids).toHaveLength(3);
    });
  });

  describe("selectors", () => {
    describe("selectAllTraces", () => {
      it("returns all traces as an array", () => {
        const root = toRoot(
          entitiesReducer(
            undefined,
            upsertTraces([makeTrace("t1"), makeTrace("t2")]),
          ),
        );
        expect(selectAllTraces(root)).toHaveLength(2);
      });
    });

    describe("selectTraceById", () => {
      it("returns the trace for the given id", () => {
        const t1 = makeTrace("t1");
        const root = toRoot(entitiesReducer(undefined, upsertTraces([t1])));
        expect(selectTraceById(root, "t1")).toEqual(t1);
      });

      it("returns undefined for an unknown id", () => {
        const root = toRoot(entitiesReducer(undefined, { type: "@@INIT" }));
        expect(selectTraceById(root, "unknown")).toBeUndefined();
      });
    });

    describe("selectAllReflections / selectReflectionById", () => {
      it("returns the reflection for the given id", () => {
        const r1 = makeReflection("r1");
        const root = toRoot(
          entitiesReducer(undefined, upsertReflections([r1])),
        );
        expect(selectReflectionById(root, "r1")).toEqual(r1);
      });

      it("returns all reflections", () => {
        const root = toRoot(
          entitiesReducer(
            undefined,
            upsertReflections([makeReflection("r1"), makeReflection("r2")]),
          ),
        );
        expect(selectAllReflections(root)).toHaveLength(2);
      });
    });

    describe("selectAllUsers", () => {
      it("returns all users", () => {
        const root = toRoot(
          entitiesReducer(undefined, upsertUsers([makeUser("u1")])),
        );
        expect(selectAllUsers(root)).toHaveLength(1);
      });
    });

    describe("selectTraceFetchStatus", () => {
      it("returns 'none' when no status has been set", () => {
        const root = toRoot(entitiesReducer(undefined, { type: "@@INIT" }));
        expect(selectTraceFetchStatus("t1")(root)).toBe("none");
      });

      it("returns the correct status", () => {
        const root = toRoot(
          entitiesReducer(
            undefined,
            setTraceFetchStatus({ id: "t1", status: "done" }),
          ),
        );
        expect(selectTraceFetchStatus("t1")(root)).toBe("done");
      });
    });

    describe("selectTraceError", () => {
      it("returns the error for a trace id", () => {
        const root = toRoot(
          entitiesReducer(
            undefined,
            setTraceError({ id: "t1", error: "Oops" }),
          ),
        );
        expect(selectTraceError("t1")(root)).toBe("Oops");
      });

      it("returns undefined when no error has been set", () => {
        const root = toRoot(entitiesReducer(undefined, { type: "@@INIT" }));
        expect(selectTraceError("t1")(root)).toBeUndefined();
      });
    });

    describe("selectReflectionFetchStatus", () => {
      it("returns 'none' when no status has been set", () => {
        const root = toRoot(entitiesReducer(undefined, { type: "@@INIT" }));
        expect(selectReflectionFetchStatus("r1")(root)).toBe("none");
      });
    });
  });
});
