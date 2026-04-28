import { describe, it, expect } from "vitest";
import counterReducer, {
  increment,
  decrement,
  incrementByAmount,
  selectCount,
} from "./counterSlice";
import type { RootState } from "@/store/store";

// --- Tests are written against stated requirements, not implementation details ---
// Requirements:
//   - Initial count is 0
//   - increment adds 1
//   - decrement subtracts 1
//   - incrementByAmount adds the given number
//   - selectCount returns the current count from state

const initialState = { value: 0 };

describe("counterSlice", () => {
  describe("initial state", () => {
    it("returns initial count of 0 when state is undefined", () => {
      expect(counterReducer(undefined, { type: "@@INIT" }).value).toBe(0);
    });
  });

  describe("increment", () => {
    it("adds 1 to the count", () => {
      const state = counterReducer(initialState, increment());
      expect(state.value).toBe(1);
    });

    it("can increment multiple times", () => {
      let state = counterReducer(initialState, increment());
      state = counterReducer(state, increment());
      expect(state.value).toBe(2);
    });
  });

  describe("decrement", () => {
    it("subtracts 1 from the count", () => {
      const state = counterReducer({ value: 5 }, decrement());
      expect(state.value).toBe(4);
    });

    it("can go below 0", () => {
      const state = counterReducer(initialState, decrement());
      expect(state.value).toBe(-1);
    });
  });

  describe("incrementByAmount", () => {
    it("adds the given positive amount", () => {
      const state = counterReducer(initialState, incrementByAmount(10));
      expect(state.value).toBe(10);
    });

    it("adds a negative amount (effectively decrements)", () => {
      const state = counterReducer({ value: 5 }, incrementByAmount(-3));
      expect(state.value).toBe(2);
    });

    it("adds zero without changing the value", () => {
      const state = counterReducer({ value: 7 }, incrementByAmount(0));
      expect(state.value).toBe(7);
    });
  });

  describe("selectCount", () => {
    it("returns the counter value from root state", () => {
      const rootState = { counter: { value: 42 } } as RootState;
      expect(selectCount(rootState)).toBe(42);
    });
  });
});
